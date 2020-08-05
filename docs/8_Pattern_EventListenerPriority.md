# Pattern: EventListenerPriority

In this chapter we look at how we implement an alternative method to set the `priority` for the sequence of event listeners. This is an alternative to using the options `first` and `grab` in the previous chapter.

## new EventListenerOption: `priority`

`priority` tells the `EventTarget` to sort the event listener with the given priority value in the EventTargetRegistry FIFO queue. To accomplish this, the extended `addEventListener(...)` method needs to:
1. remove all the registered event listeners in the underlying, native register, then
2. place the new event listener before any other event listener with the same or lower priority in the EventTargetRegistry, and then
3. add all the event listeners in the EventTargetRegistry to the underlying, native register again.

If `priority` is used, then `first: true` will be converted into a `priority: Number.MAX_SAFE_INTEGER`. If priority is higher than `Number.MAX_SAFE_INTEGER`, then it will be lowered to `Number.MAX_SAFE_INTEGER`. The priority defaults to `0` if not specified or if wrongly specified. 
 
```javascript
  EventTarget.prototype.addEventListener = function (name, listener, options) {
    this._eventTargetRegistry || (this._eventTargetRegistry = {});
    this._eventTargetRegistry[name] || (this._eventTargetRegistry[name] = []);
    const entry = options instanceof Object ? Object.assign({listener}, options) : {listener, capture: options};
    entry.capture = !!entry.capture;
    const index = findEquivalentListener(this._eventTargetRegistry[name], listener, entry.capture);
    if (index >= 0)
      return;
    if (entry.immediateOnly) {
      entry.once = false;
      const immediateSelf = this, immediateCb = entry.listener, immediateCapture = entry.capture;
      const macroTask = toggleTick(function () {
        immediateSelf.removeEventListener(name, immediateCb, immediateCapture);
      });
      entry.listener = function (e) {
        macroTask.cancel();
        immediateSelf.removeEventListener(name, immediateCb, immediateCapture);
        immediateCb(e);
      }
    }
    if (entry.once) {
      const onceSelf = this, onceCb = entry.listener, onceCapture = entry.capture;
      entry.listener = function (e) {
        onceSelf.removeEventListener(name, onceCb, onceCapture);
        onceCb(e);
      }
    }
    if (entry.first)
      entry.priority = Number.MAX_SAFE_INTEGER;
    // todo throw an Error instead of reverting to 0?
    entry.priority = parseInt(entry.priority) || 0;
    if (entry.priority > Number.MAX_SAFE_INTEGER)
      entry.priority = Number.MAX_SAFE_INTEGER;
    if (entry.priority < Number.MIN_SAFE_INTEGER)
      entry.priority = Number.MIN_SAFE_INTEGER;
    for (let listener of this._eventTargetRegistry[name])
      ogRemove.call(this, name, listener.listener, listener);
    const i = this._eventTargetRegistry[name].findIndex(listener => listener.priority < entry.priority);
    i === -1 ?
      this._eventTargetRegistry[name].push(entry) :
      this._eventTargetRegistry[name].splice(i, 0, entry);
    for (let listener of this._eventTargetRegistry[name])
      ogAdd.call(this, name, listener.listener, listener);
  };
``` 

## Demo: EventTargetRegistry

```html
<script>
  function toggleTick(cb) {
    const details = document.createElement("details");
    details.style.display = "none";
    details.ontoggle = cb;
    document.body.appendChild(details);
    details.open = true;
    Promise.resolve().then(details.remove.bind(details));
    return {
      cancel: function () {
        details.ontoggle = undefined;
      },
      resume: function () {
        details.ontoggle = cb;
      }
    };
  }

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
    if (entry.immediateOnly) {
      entry.once = false;
      const immediateSelf = this, immediateCb = entry.listener, immediateCapture = entry.capture;
      const macroTask = toggleTick(function () {
        immediateSelf.removeEventListener(name, immediateCb, immediateCapture);
      });
      entry.listener = function (e) {
        macroTask.cancel();
        immediateSelf.removeEventListener(name, immediateCb, immediateCapture);
        immediateCb(e);
      }
    }
    if (entry.once) {
      const onceSelf = this, onceCb = entry.listener, onceCapture = entry.capture;
      entry.listener = function (e) {
        onceSelf.removeEventListener(name, onceCb, onceCapture);
        onceCb(e);
      }
    }
    if (entry.first)
      entry.priority = Number.MAX_SAFE_INTEGER;
    // todo throw an Error instead of reverting to 0?
    entry.priority = parseInt(entry.priority) || 0;
    if (entry.priority > Number.MAX_SAFE_INTEGER)
      entry.priority = Number.MAX_SAFE_INTEGER;
    if (entry.priority < Number.MIN_SAFE_INTEGER)
      entry.priority = Number.MIN_SAFE_INTEGER;
    for (let listener of this._eventTargetRegistry[name])
      ogRemove.call(this, name, listener.listener, listener);
    const i = this._eventTargetRegistry[name].findIndex(listener => listener.priority < entry.priority);
    i === -1 ?
      this._eventTargetRegistry[name].push(entry) :
      this._eventTargetRegistry[name].splice(i, 0, entry);
    for (let listener of this._eventTargetRegistry[name])
      ogAdd.call(this, name, listener.listener, listener);
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

<h1>Click me!</h1>

<script>
  const h1 = document.querySelector("h1");

  h1.addEventListener("click", () => console.log(3), {priority: 1});
  h1.addEventListener("click", () => console.log(2), {priority: 2});
  h1.addEventListener("click", () => console.log(1), {priority: 3});
  h1.addEventListener("click", () => console.log(4), {priority: 0});
  h1.addEventListener("click", () => console.log(6), {priority: -1});
  h1.addEventListener("click", () => console.log(5), {priority: "nan"});
  h1.addEventListener("click", () => console.log(-1), {priority: Number.MAX_SAFE_INTEGER, once:true});
  h1.addEventListener("click", () => console.log(0), {first: true, priority: -1});
  h1.addEventListener("click", () => console.log(7), {priority: Number.MIN_SAFE_INTEGER});
  h1.dispatchEvent(new MouseEvent("click"));
  h1.dispatchEvent(new MouseEvent("click"));
</script>
```

Result:

```
-1
0
1
2
3
4
5
6
7
0
1
2
3
4
5
6
7
```

## References

 * [MDN: `EventTarget`](https://developer.mozillthea.org/en-US/docs/Web/API/EventTarget)
 * [Google: `getEventListeners(target)`](https://developers.google.com/web/updates/2015/05/get-and-debug-event-listeners)