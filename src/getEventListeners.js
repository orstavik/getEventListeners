const targetToListeners = new WeakMap();

//this thing returns immutable listeners
function getEventListeners(target, type, phase) {
  const allListeners = targetToListeners.get(target);
  if (!allListeners)
    return [];
  if (!type && !phase)
    return allListeners.slice();
  if (!allListeners[type])
    return [];
  if (!phase || phase === Event.AT_TARGET)
    return allListeners[type].slice();
  if (phase === Event.CAPTURING_PHASE)
    return allListeners[type].filter(listener => listener.capture);
  if (phase === Event.BUBBLING_PHASE)
    return allListeners[type].filter(listener => !listener.capture);
  throw new Error("Illegal event phase for getEventListeners: phase can only be Event.BUBBLING_PHASE, Event.CAPTURING_PHASE, or Event.AT_TARGET.");
}

function findEquivalentListener(registryList, listener, useCapture) {
  return registryList.findIndex(cbOptions => cbOptions.listener === listener && cbOptions.capture === useCapture);
}

function makeEntry(target, type, listener, options) {
  const entry = options instanceof Object ?
    Object.assign({}, options, {listener, type}) :
    {listener, type, capture: !!options};
  entry.capture = !!entry.capture;
  entry.bubbles = !!entry.bubbles;
  entry.once = !!entry.once;
  entry.passive = !!entry.passive;
  entry.target = target;
  //see line 96-97 in https://github.com/WebReflection/dom4/blob/master/src/event-target.js
  Object.defineProperty(entry, "removed", {
    get: function () {
      return dynamicallyRemovedEntries.has(this);
    }
  });
  Object.freeze(entry);
  return entry;
}

function addListener(target, type, listener, options) {
  let allListeners = targetToListeners.get(target);
  if (!allListeners)
    targetToListeners.set(target, allListeners = {});
  let typeListeners = allListeners[type] || (allListeners[type] = []);
  const capture = !!(options instanceof Object ? options.capture : options);
  const index = findEquivalentListener(typeListeners, listener, capture);
  if (index !== -1)
    return null;
  const entry = makeEntry(target, type, listener, options);
  typeListeners.push(entry);
  return entry;
}

function removeListener(target, type, listener, options) {
  let allListeners = targetToListeners.get(target);
  if (!allListeners)
    return null;
  let typeListeners = allListeners[type];
  if (!typeListeners)
    return null;
  const capture = !!(options instanceof Object ? options.capture : options);
  const index = findEquivalentListener(typeListeners, listener, capture);
  if (index === -1)
    return null;
  return typeListeners.splice(index, 1)[0];  //mutates the list in the targetToListeners
}

const dynamicallyRemovedEntries = new WeakSet();

export function addEventTargetRegistry(EventTargetPrototype = EventTarget.prototype) {
  const ogAdd = EventTargetPrototype.addEventListener;
  const ogRemove = EventTargetPrototype.removeEventListener;

  function addEntry(entry) {
    ogAdd.call(entry.target, entry.type, entry.listener, entry);
  }

  function removeEntry(entry) {
    ogRemove.call(entry.target, entry.type, entry.listener, entry);
  }

  function addEventListenerRegistry(type, listener, options) {
    const entry = addListener(this, type, listener, options);
    if (!entry)             //addListener returns false when equivalent listener is already added.
      return;
    addEntry(entry);
    //the inside of the system sees the more elaborate options object.
    //this will break the native getListeners in dev tools, but do nothing else.
  }

  function removeEventListenerRegistry(type, listener, options) {
    const entry = removeListener(this, type, listener, options);
    if (!entry)  //removeListener returns false when there is no listener to be removed.
      return;
    dynamicallyRemovedEntries.add(entry);
    removeEntry(entry);
  }

  Object.defineProperty(EventTargetPrototype, "addEventListener", {value: addEventListenerRegistry});
  Object.defineProperty(EventTargetPrototype, "removeEventListener", {value: removeEventListenerRegistry});

  return getEventListeners;
}