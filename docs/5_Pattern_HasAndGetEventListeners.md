# Pattern: HasAndGetEventListeners

With the EventTargetRegistry in place, we can now extend the `EventTarget` API with two useful methods:
1. `getEventListeners(type, captureOnly/bubblesOnly/both)`
2. `hasEventListener(type, cb, options)`

## Implementation

```javascript
EventTarget.prototype.getEventListeners = function (name, phase) {
  if (!this._eventTargetRegistry || !this._eventTargetRegistry[name])
    return null;
  if (phase === Event.AT_TARGET)
    return this._eventTargetRegistry[name].slice();
  if (phase === Event.CAPTURING_PHASE)
    return this._eventTargetRegistry[name].filter(listener => listener.capture);
  //(phase === Event.BUBBLING_PHASE)
  return this._eventTargetRegistry[name].filter(listener => !listener.capture);
};

EventTarget.prototype.hasEventListener = function (name, cb, options) {
  if (!this._eventTargetRegistry || !this._eventTargetRegistry[name])
    return false;
  const capture = !!(options instanceof Object ? options.capture : options);
  const index = findEquivalentListener(this._eventTargetRegistry[name], cb, capture);
  return index !== -1;
};
```

## Demo: EventTargetRegistry

```html
<script>
  /**
   * getEventListeners(name, phase) returns a list of all the event listeners entries
   * matching that event name and that event phase.
   *
   * @param name
   * @param phase either Event.CAPTURING_PHASE, Event.AT_TARGET, or Event.BUBBLING_PHASE.
   *        Defaults to Event.BUBBLING_PHASE.
   * @returns {[{listener, capture}]}
   */
  EventTarget.prototype.getEventListeners = function (name, phase) {
    if (!this._eventTargetRegistry || !this._eventTargetRegistry[name])
      return null;
    if (phase === Event.AT_TARGET)
      return this._eventTargetRegistry[name].slice();
    if (phase === Event.CAPTURING_PHASE)
      return this._eventTargetRegistry[name].filter(listener => listener.capture);
    //(phase === Event.BUBBLING_PHASE)
    return this._eventTargetRegistry[name].filter(listener => !listener.capture);
  };

  /**
   * hasEventListeners(name, cb, options) returns a list of all the event listeners entries
   * matching that event name and that event phase. To query for an event listener in BOTH the
   * capture and bubble propagation phases, one must do two queries:
   *
   *    el.hasEventListener(name, cb, false) || el.hasEventListener(name, cb, true)
   *
   * @param name
   * @param cb
   * @param options the only option used in identifying the event listener is capture/useCapture.
   * @returns true if an equivalent event listener is in the list
   */
  EventTarget.prototype.hasEventListener = function (name, cb, options) {
    if (!this._eventTargetRegistry || !this._eventTargetRegistry[name])
      return false;
    const capture = !!(options instanceof Object ? options.capture : options);
    const index = findEquivalentListener(this._eventTargetRegistry[name], cb, capture);
    return index !== -1;
  };

  function findEquivalentListener(registryList, listener, useCapture) {
    return registryList.findIndex(cbOptions => cbOptions.listener === listener && cbOptions.capture === useCapture);
  }

  const ogAdd = EventTarget.prototype.addEventListener;
  const ogRemove = EventTarget.prototype.removeEventListener;

  EventTarget.prototype.addEventListener = function (name, listener, options) {
    this._eventTargetRegistry || (this._eventTargetRegistry = {});
    this._eventTargetRegistry[name] || (this._eventTargetRegistry[name] = []);
    const entry = options instanceof Object ? Object.assign({listener}, options) : {listener, capture: options};
    entry.capture = !!entry.capture;
    const index = findEquivalentListener(this._eventTargetRegistry[name], listener, entry.capture);
    if (index >= 0)
      return;
    this._eventTargetRegistry[name].push(entry);
    ogAdd.call(this, name, listener, options);
  };

  EventTarget.prototype.removeEventListener = function (name, listener, options) {
    if (!this._eventTargetRegistry || !this._eventTargetRegistry[name])
      return;
    const capture = !!(options instanceof Object ? options.capture : options);
    const index = findEquivalentListener(this._eventTargetRegistry[name], listener, capture);
    if (index === -1)
      return;
    this._eventTargetRegistry[name].splice(index, 1);
    ogRemove.call(this, name, listener, options);
  };
</script>

<h1>Hello sunshine!</h1>

<script>
  function log1() {
    console.log("one");
  }

  const h1 = document.querySelector("h1");

  h1.addEventListener("click", log1);
  h1.addEventListener("click", log1.bind({}));
  h1.addEventListener("click", log1, true);

  console.log(h1.hasEventListener("click", log1));                         //true
  console.log(h1.hasEventListener("click", log1, {capture: true}));        //true
  console.log(h1.getEventListeners("click", Event.AT_TARGET).length);      //3
  console.log(h1.getEventListeners("click", Event.BUBBLING_PHASE).length); //2
  console.log(h1.getEventListeners("click", Event.CAPTURING_PHASE).length);//1
</script>
```

Result:

```
true
true
3
2
1
```




We need to be able to read custom event list properties, rearrange their order, and or trigger different event listeners on different elements.
   
```javascript
function block(e){
  e.stopImmediatePropagation(); 
  e.preventDefault();
}
const missingOption = {
  capture: true, 
  once: true, 
  first: true,            //this option doesn't exist
  onlyImmediately: true   //this option doesn't exist
};
window.addEventListener("click", block, missingOption);
```  


## References

 * [MDN: `EventTarget`](https://developer.mozillthea.org/en-US/docs/Web/API/EventTarget)
 * [Google: `getEventListeners(target)`](https://developers.google.com/web/updates/2015/05/get-and-debug-event-listeners)