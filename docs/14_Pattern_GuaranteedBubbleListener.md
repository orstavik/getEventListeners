# Guaranteed bubble listener:

The purpose of the GuaranteedBubbleListener is to have an event listener that: 
1. inside a DOM context,
2. runs for all instances of an event type,
3. during the bubble(/target bubble) phase.

This is critical for making functionality such as event controllers able to run in DOM context bottom-up.

## Strategy

To add a GuaranteedBubbleListener for *bubbling* events is simple: 
 * add a static unstoppable event listener on the propagation root.
 
However, to make a GuaranteedBubbleListener for *non-bubbling* events is a bit more convoluted:
1. add a static unstoppable event listener on the propagation root in the capture phase,
2. from this static event listener, add another *dynamic, `unstoppable: true, native once: true, capture: false`* event listener on the target with the needed event listener function. The `.target` on the event in the static capture phase event listener will be local to the given DOM context.

## As extended EventListenerOption (monkeypatch)?

The benefit of adding this as an eventlistener option, is that it can run using `{capture: true}` as a fallback. That is really nice. This means that event controllers might still work even in a setting where bubbleGuarantee is missing. A graceful fallback.

```javascript
const nonBubblingEvents = ["toggle", "load", "unload", "scroll", "blur", "focus", "DOMNodeRemovedFromDocument", "DOMNodeInsertedIntoDocument", "loadstart", "loadend", "progress", "abort", "error", "pointerenter", "pointerleave", "mouseenter", "mouseleave", "rowexit", "beforeunload", "stop", "start", "finish", "bounce", "Miscellaneous", "afterprint", "propertychange", "filterchange", "readystatechange", "losecapture"];

//on the propagationRoot
//todo this is a naive implementation
//todo it will not tackle if the method is added with different onTarget options.
//todo instead, the nonBubblingEvents should be extended to include different type names, so that the method always finds this out itself.

const nonBubblingWrappers = new WeakMap();

const original = EventTarget.prototype.addEventListener;
Object.defineProperty(EventTarget.prototype, "addEventListener", {
  value: function(type, cb, options){
    let fun = cb;
    if (options?.bubbleGuarantee){
      options.capture = false;
      options.unstoppable = true;
      if(nonBubblingEvents.indexOf(type) >=0||options?.onTarget){
        fun = nonBubblingWrappers.get(cb);
        if (!fun){
          fun = function (e) {
                e.target.addEventListener(e.type, fun, {once: true});
              };
          nonBubblingWrappers.set(cb, fun);        
        }      
      }
    }
    original.call(this, type, fun, options);
  }
});

const original2 = EventTarget.prototype.removeEventListener;
Object.defineProperty(EventTarget.prototype, "removeEventListener", {
  value: function(type, cb, options){
    let fun = cb;
    if (options?.bubbleGuarantee){
      options.capture = false;
      options.unstoppable = true;
      if(nonBubblingEvents.indexOf(type) >=0||options?.onTarget)
        fun = nonBubblingWrappers.get(cb);
    }
    original2.call(this, type, fun, options);
  }
});
```

This can then be referred to like so:
```javascript
target.addEventListener("click", ()=>console.log("omg"), {bubbleGuarantee: true, capture: true});
//this will be added as a capture phase event listener if the eventlisteneroption bubbleGuarantee is not supported, or it will be added as a bubble listener with unstoppable, and a wrapper that will  pass the event listener to the target if the event is non-bubbling. 
``` 

## Interface

The method of adding a GuaranteedBubbleListener should be added to the PropagationRoot, ie. the ShadowRoot or the Document (or the Window). The event listener is unique to the DOM context, not to the individual EventTarget.

The method needs the `eventName`, the callback `function`, and an option `onTarget` to specify if the `eventName` will be on a non-bubbling event.

The method uses a register of all event types which are non-bubbling.

```javascript
const nonBubblingEvents = ["toggle", "load", "unload", "scroll", "blur", "focus", "DOMNodeRemovedFromDocument", "DOMNodeInsertedIntoDocument", "loadstart", "loadend", "progress", "abort", "error", "pointerenter", "pointerleave", "mouseenter", "mouseleave", "rowexit", "beforeunload", "stop", "start", "finish", "bounce", "Miscellaneous", "afterprint", "propertychange", "filterchange", "readystatechange", "losecapture"];

//on the propagationRoot
//todo this is a naive implementation
//todo it will not tackle if the method is added with different onTarget options.
//todo instead, the nonBubblingEvents should be extended to include different type names, so that the method always finds this out itself.

const nonBubblingWrappers = new WeakMap();
function addGuaranteedBubbleListener(propagationRoot, eventname, fun, onTarget) {
  if (nonBubblingEvents.indexOf(eventname) === -1 && !onTarget)
    return propagationRoot.addEventListener(eventname, fun);
  let onTargetWrapper = nonBubblingWrappers.get(fun);
  if (!onTargetWrapper) {
    onTargetWrapper = function (e) {
      e.target.addEventListener(eventname, fun, {once: true});
    };
    nonBubblingWrappers.set(fun, onTargetWrapper);
  }
  return propagationRoot.addEventListener(eventname, onTargetWrapper, {capture: true});
}

function removeGuaranteedBubbleListener(propagationRoot, eventname, fun, onTarget) {
  if (nonBubblingEvents.indexOf(eventname) === -1 && !onTarget)
    return propagationRoot.removeEventListener(eventname, fun);
  return propagationRoot.removeEventListener(eventname, nonBubblingWrappers.get(fun), {capture: true});
}
```  

## Demo:

```html
<script>
  const nonBubblingEvents = ["toggle", "load", "unload", "scroll", "blur", "focus", "DOMNodeRemovedFromDocument", "DOMNodeInsertedIntoDocument", "loadstart", "loadend", "progress", "abort", "error", "pointerenter", "pointerleave", "pointerleave", "rowexit", "beforeunload", "stop", "start", "finish", "bounce", "Miscellaneous", "afterprint", "propertychange", "filterchange", "readystatechange", "losecapture"];

  //on the propagationRoot
  //todo this is a naive implementation
  //todo it will not tackle if the method is added with different onTarget options.
  //todo instead, the nonBubblingEvents should be extended to include different type names, so that the method always finds this out itself.
  const nonBubblingWrappers = new WeakMap();

  function addGuaranteedBubbleListener(propagationRoot, eventname, fun, onTarget) {
    if (nonBubblingEvents.indexOf(eventname) === -1 && !onTarget)
      return propagationRoot.addEventListener(eventname, fun);
    let onTargetWrapper = nonBubblingWrappers.get(fun);
    if (!onTargetWrapper) {
      onTargetWrapper = function (e) {
        e.target.addEventListener(eventname, fun, {once: true});
      };
      nonBubblingWrappers.set(fun, onTargetWrapper);
    }
    return propagationRoot.addEventListener(eventname, onTargetWrapper, {capture: true});
  }

  function removeGuaranteedBubbleListener(propagationRoot, eventname, fun, onTarget) {
    if (nonBubblingEvents.indexOf(eventname) === -1 && !onTarget)
      return propagationRoot.removeEventListener(eventname, fun);
    return propagationRoot.removeEventListener(eventname, nonBubblingWrappers.get(fun), {capture: true});
  }
</script>

<div>
  <h1>hello sunshine</h1>
  <details>
    <summary>hello</summary>
    toggle
  </details>
</div>

<script>
  addGuaranteedBubbleListener(document, "click", e => console.log("normal", e.type, e.currentTarget, e.eventPhase));
  addGuaranteedBubbleListener(document, "click", e => console.log("onTarget", e.type, e.currentTarget, e.eventPhase), true);
  addGuaranteedBubbleListener(document, "toggle", e => console.log("normal", e.type, e.currentTarget, e.eventPhase));
  addGuaranteedBubbleListener(document, "toggle", e => console.log("onTarget", e.type, e.currentTarget, e.eventPhase), true);
</script>
```

## References

 * dunno