import {downgradeCancelBubble, upgradeCancelBubble} from "https://cdn.jsdelivr.net/gh/orstavik/unstoppable@1.0.0/src/upgradeEvent_capture_cancelBubble.js";

const removedListeners = new WeakSet();

function verifyFirstLast(target, type, options) {
  if (!(options instanceof Object))
    return;
  if (options.last && options.capture)
    throw new Error("last option can only be used with bubble phase (at_target bubble phase) event listeners");
  if (options.first && !options.capture)
    throw new Error("first option can only be used with capture phase (at_target capture phase) event listeners");
  const previousLastEntry = getEventListeners(target, type).filter(listener => listener.last);
  if (options.last && previousLastEntry.length === 1)
    throw new Error("only one event listener {last: true} can be added to the same target and event type.");
  const previousFirstEntry = getEventListeners(target, type).filter(listener => listener.first);
  if (options.first && previousFirstEntry.length === 1)
    throw new Error("only one event listener {first: true} can be added to the same target and event type.");
}

//this thing returns immutable listeners
function getEventListeners(target, type, phase) {
  const allListeners = listeners.get(target);
  if (!allListeners)
    return !type ? {} : [];
  if (!type && !phase) {
    const dictClone = {};
    for (let type in allListeners)
      dictClone[type] = allListeners[type].slice();
    return dictClone;
  }
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

function dispatchErrorEvent(error, message) {
  const uncaught = new ErrorEvent('error', {error, message});
  window.dispatchEvent(uncaught);
  !uncaught.defaultPrevented && console.error(uncaught);
}

//todo this function we also want to do in the dispatchEvent method.
function runEventListener(target, event, listener) {
  if (listener.removed)                                  //dynamic removing of event listener during propagation on the same eventTarget.
    return;
  if (!listener.unstoppable && event.cancelBubble === 1) //stopPropagation()
    return;
  if (listener.once)
    target.removeEventListener(event.type, listener.listener, listener.capture);
  try {
    const cb = listener.listener;
    cb instanceof Function ? cb.call(target, event) : cb.handleEvent(event);
  } catch (error) {
    dispatchErrorEvent(error, 'Uncaught Error: event listener break down');
  }
}

//target*! => type! => {listener}!
// To speed up retrieval of relevant getListeners, we can make an extra map for "type capture" and "type bubble".
// To speed up hasListener check, we can make a //target*! => *cb! => [type capture, type bubble] map.
const listeners = new WeakMap();

function hasEventListener(type, outsideCapture, cb) {
  const dict = listeners.get(this);
  if (!dict)
    return false;
  const list = dict[type];
  return list && list.find(({listener, capture}) => listener === cb && capture === outsideCapture);
}

/**
 * Patches the composedPathContexts at first event listener invocation for this event.
 * @param e
 */
function patchEventInitialState(e) {
  if (!e.composedPathContexts) {                  //todo do we want to do this.
    const composedPathContexts = e.composedPath().map(target => target.getRootNode());
    Object.defineProperty(e, "composedPathContexts", {get: () => composedPathContexts});
  }
  // patchStateOfAHrefAttributeAtEventDispatch(e);//todo do we want/need this??? We need this for the defaultAction, we don't need it here..
}

/**
 * cancelBubble rely on capture and currentTarget being up to date
 *
 * @param e
 * @param listener
 */
function patchEventListenerState(e, listener){
  Object.defineProperty(e, "capture", {value: listener.capture, configurable: true});
}

function genericHandleEventListener(e) {
  patchEventInitialState(e);
  patchEventListenerState(e, this);
  runEventListener(this.target, e, this);
}

function makeListener(target, type, cb, capture, options, keys) {
  if (options instanceof Object) {
    const listener = {type, capture, target, listener: cb, handleEvent: genericHandleEventListener};
    for (let key in keys)
      listener[key] = options.hasOwnProperty(key) ? options[key] : keys[key];
    Object.defineProperty(listener, "removed", {get: function(){return removedListeners.has(this);}});
    Object.freeze(listener);
    return listener;
  }
  const listener = Object.assign({}, keys, {type, capture, target, listener: cb, handleEvent: genericHandleEventListener});
  Object.defineProperty(listener, "removed", {get: function(){return removedListeners.has(this);}});
  Object.freeze(listener);
  return listener;
}

function addListener(target, listener) {
  let dict = listeners.get(target);
  !dict && listeners.set(target, dict = {});
  const list = dict[listener.type] || (dict[listener.type] = []);
  list.push(listener);
}

function removeListener(target, type, cb, outsideCapture) {
  const dict = listeners.get(target);
  if (!dict)
    return undefined;
  const list = dict[type];
  if (!list)
    return undefined;
  const listenerIndex = list.findIndex(({listener, capture}) => listener === cb && outsideCapture === capture);
  if (listenerIndex === -1)
    return undefined;
  return list.splice(listenerIndex, 1)[0];
}

let addEventListenerOG;
let removeEventListenerOG;
let stopPropagationOG;
let stopImmediatePropagationOG;

//unstoppable event listeners will not obey any stopPropagations.
/**
 * depends on the upgraded version of cancelBubble
 * that distinguish between stopPropagation() and stopImmediatePropagation()
 */
export function upgradeAddEventListener(eventListenerOptions = {unstoppable: false, first: false, last: false}) {
  eventListenerOptions = Object.assign(
    {},
    {capture: false, once: false, passive: true},
    eventListenerOptions
  );
  addEventListenerOG = Object.getOwnPropertyDescriptor(EventTarget.prototype, "addEventListener");
  removeEventListenerOG = Object.getOwnPropertyDescriptor(EventTarget.prototype, "removeEventListener");
  stopPropagationOG = Object.getOwnPropertyDescriptor(Event.prototype, "stopPropagation");
  stopImmediatePropagationOG = Object.getOwnPropertyDescriptor(Event.prototype, "stopImmediatePropagation");
  Object.defineProperties(Event.prototype, {
    stopPropagation: {
      value: function () {
      }
    },
    stopImmediatePropagation: {
      value: function () {
      }
    }
  });

  function addEventListenerUpgraded(type, cb, options) {
    const capture = !!(options instanceof Object ? options.capture : options);
    if (this.hasEventListener(type, capture, cb))
      return;
    verifyFirstLast(this, type, options);
    const listener = makeListener(this, type, cb, capture, options, eventListenerOptions);

    //FIRST start
    if(listener.first){
      const listeners = getEventListeners(this, type);
      for (let listener of listeners)
        this.removeEventListener(type, listener.listener, listener);
      addListener(this, listener);
      const onceRemoved = Object.assign({}, listener, {once: false});
      addEventListenerOG.value.call(this, type, listener, onceRemoved);
      for (let listener of listeners)
        this.addEventListener(type, listener.listener, listener);
      return;
    }
    //FIRST end

    addListener(this, listener);
    const onceRemoved = Object.assign({}, listener, {once: false}); //runEventListener must override once
    addEventListenerOG.value.call(this, type, listener, onceRemoved);

    //LAST start
    if (!listener.last) {
      const last = getEventListeners(this, type, Event.BUBBLING_PHASE).filter(listener => listener.last)[0];
      if (last) {
        this.removeEventListener(type, last.listener, last);
        this.addEventListener(type, last.listener, last);
      }
    }
    //LAST end
  }

  function removeEventListenerUpgraded(type, cb, options) {
    const capture = !!(options instanceof Object ? options.capture : options);
    const listener = removeListener(this, type, cb, capture);
    if (!listener)
      return;
    removedListeners.add(listener);
    removeEventListenerOG.value.call(this, type, listener, capture);
  }

  Object.defineProperties(EventTarget.prototype, {
    addEventListener: {value: addEventListenerUpgraded},
    removeEventListener: {value: removeEventListenerUpgraded},
    hasEventListener: {value: hasEventListener, configurable: true}
  });
  const clearStopPropagationStateAtTheStartOfDispatchEvent = upgradeCancelBubble();
  return {
    getEventListeners,
    clearStopPropagationStateAtTheStartOfDispatchEvent,
    runEventListener,
    patchEventInitialState,
    patchEventListenerState
  };
}

export function downgradeAddEventListener() {
  downgradeCancelBubble();
  Object.defineProperties(Event.prototype, {
    stopPropagation: stopPropagationOG,
    stopImmediatePropagation: stopImmediatePropagationOG
  });
  Object.defineProperties(EventTarget.prototype, {
    addEventListener: addEventListenerOG,
    removeEventListener: removeEventListenerOG
  });
  delete EventTarget.prototype.hasEventListener;
  delete EventTarget.prototype.runEventListener;
}