//target* => cb* => type+" "+capture => cbOnce
const targetCbWrappers = new WeakMap();

function makeKey(type, options) {
  return (options instanceof Object ? options.capture : options) ? type + " capture" : type;
}

function hasWrapper(target, type, cb, options) {
  const dict = targetCbWrappers.get(target)?.get(cb);
  return dict && makeKey(type, options) in dict;
}

function setWrapper(target, type, cb, options, wrapped) {
  let cbMap = targetCbWrappers.get(target);
  if (!cbMap)
    targetCbWrappers.set(target, cbMap = new WeakMap());
  let typeDict = cbMap.get(cb);
  if (!typeDict)
    cbMap.set(cb, typeDict = {});
  typeDict[makeKey(type, options)] = wrapped;
}

function removeWrapper(target, type, options, cb) {
  const typeDict = targetCbWrappers.get(target)?.get(cb);
  if (!typeDict)
    return null;
  const key = makeKey(type, options);
  const result = typeDict[key];
  delete typeDict[key];
  return result;
}

//scoped event listeners will only obey stopPropagations called inside the same scope.
//unstoppable event listeners will not obey any stopPropagations.
export function addEventListenerOptionScopedUnstoppable(EventTargetPrototype, isStopped) {
  const addEventListenerOG = EventTargetPrototype.addEventListener;
  const removeEventListenerOG = EventTargetPrototype.removeEventListener;

  function addEventListenerUnstoppable(type, cb, options) {
    if (hasWrapper(this, type, cb, options))
      return;
    let wrapped;
    if (options instanceof Object && options.unstoppable) {
      wrapped = cb;
    } else if (options instanceof Object && options.scoped) {
      wrapped = function (e) {
        !isStopped(e, true) && cb.call(this, e);       //when we control dispatch, these two checks can be done before we add
                                                       // the event listener to the task queue
      };                                               //when we are reacting to the native dispatch, we have to run the listeners.
    } else {
      wrapped = function (e) {                         //we check the listener options, and then we check the e.isScoped and isStopped(event, scoped)
        !isStopped(e, e.isScoped) && cb.call(this, e); //scoped = e.isScoped || listener.scoped === true
      };                                               //isStopped = !listener.unstoppable && isStopped(event, scoped)
    }                                                  //if (!isStopped), then add the listener to the queue
    setWrapper(this, type, cb, options, wrapped)
    addEventListenerOG.call(this, type, wrapped, options);
  }

  function removeEventListenerUnstoppable(type, cb, options) {
    //tries to remove both the stoppable and the unstoppable wrapper. Don't know which one was added here.
    const args = removeWrapper(this, type, options, cb) || cb;
    removeEventListenerOG.call(this, type, args, options);
  }

  Object.defineProperties(EventTargetPrototype, {
    addEventListener: {value: addEventListenerUnstoppable},
    removeEventListener: {value: removeEventListenerUnstoppable}
  });
}