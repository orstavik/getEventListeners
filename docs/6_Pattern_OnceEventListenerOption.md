# Pattern: ExtendEventListenerOptions

In this chapter we implement two event listener options:
 1. `once` (polyfill)
 
todo should i add a special check for `window.addEventListener("mouseenter",...` so that it will add an empty event listener for mouseenter on the document too, so that the window event listener for mouseenter is run?

## polyfilled EventListenerOption: `once`

When we make a JS mirror of the EventTargetRegistry, we also need to polyfill the `once` event listener option. The reason for this is that the native implementation of the `once` option do not remove the event listener using the js `removeEventListener(..)` method, and therefore `once` event listeners will be removed from the underlying `EventTarget` nodes without being removed from the EventTargetRegistry.

Fortunately, `once` is a simple option to implement. We need only wrap the callback in an anonymous function that in addition to calling the `once` event listener, also calls the `removeEventListener(...)` to remove it. 

```javascript
EventTarget.prototype.addEventListener = function (name, listener, options) {
  this._eventTargetRegistry || (this._eventTargetRegistry = {});
  this._eventTargetRegistry[name] || (this._eventTargetRegistry[name] = []);
  const entry = options instanceof Object ? Object.assign({listener}, options) : {listener, capture: options};
  entry.capture = !!entry.capture;
  const index = findEquivalentListener(this._eventTargetRegistry[name], listener, entry.capture);
  if (index >= 0)
    return;
    if (entry.once) {
      const onceSelf = this;
      const onceCapture = entry.capture;
      entry.listener = function (e) {
        onceSelf.removeEventListener(name, entry.listener, onceCapture);
        listener(e);
      }
    }
    this._eventTargetRegistry[name].push(entry);
    ogAdd.call(this, name, entry.listener, entry);
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
    if (entry.once) {
      const onceSelf = this;
      const onceCapture = entry.capture;
      entry.onceListener = function (e) {
        onceSelf.removeEventListener(name, entry.listener, onceCapture);
        listener(e);
      }
    }
    this._eventTargetRegistry[name].push(entry);
    ogAdd.call(this, name, entry.onceListener || entry.listener, entry);
  };

  EventTarget.prototype.removeEventListener = function (name, listener, options) {
    if (!this._eventTargetRegistry || !this._eventTargetRegistry[name])
      return;
    const capture = !!(options instanceof Object ? options.capture : options);
    const index = findEquivalentListener(this._eventTargetRegistry[name], listener, capture);
    if (index === -1)
      return;
    debugger;
    const removed = this._eventTargetRegistry[name].splice(index, 1);
    ogRemove.call(this, name, removed.onceListener || removed.listener, options);
  };
</script>

<h1>Click me!</h1>

<script>
  const h1 = document.querySelector("h1");

  h1.addEventListener("click", () => console.log(0), {once: true});
  h1.addEventListener("click", () => console.log(1), {});

  h1.dispatchEvent(new MouseEvent("click"));
  h1.dispatchEvent(new MouseEvent("click"));
</script>
```

Result:

```
0
1
1
stopping click once
1       
      //clicking the "Click me!" first time
stopping click once
      //clicking the "Click me!" second time
1
```

## References

 * [MDN: `EventTarget`](https://developer.mozillthea.org/en-US/docs/Web/API/EventTarget)
 * [Google: `getEventListeners(target)`](https://developers.google.com/web/updates/2015/05/get-and-debug-event-listeners)