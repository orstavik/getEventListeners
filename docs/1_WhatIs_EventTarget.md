# WhatIs: `EventTarget`?

`addEventListener(..)`, `removeEventListener(..)`, and `dispatchEvent(..)` are methods of the `EventTarget` interface. This interface is implemented by both the `HTMLElement`, `Document`, and `Window` interfaces, thus providing the ability to listen for events on all such nodes in the DOM. So, when we speak of an EventTarget, we mean an element, `document`, or `window` node in the DOM.

To work, the `EventTarget` keeps an internal registry of all event listeners added to the each event target. We call this the EventTargetRegistry:
 * `addEventListener(type, callback, options)` adds a node to the EventTargetRegistry.
 * `removeEventListener(type, callback, options)` removes a node to the EventTargetRegistry.
 * And when the browser runs its native event propagation function, it will on each target read the relevant entries from EventTargetRegistry and call the associated callback functions.

## What does EventTargetRegistry look like? 
 
The EventTargetRegistry needs to contain all the data given in by `addEventListener(..)`: 
 * event type
 * callback function object
 * options (boolean/object)

In JS pseudo-code, we could describe it like this:
 
```javascript
const EventTargetRegistry = {
  toggle:[
    {listener: aFunctionObject, useCapture: false, passive: false, once: false},
    {listener: anotherFunction, useCapture: false, passive: false, once: false},
  ], 
  click: [
    {listener: anotherFunction, useCapture: true, passive: false, once: false},
  ]
}
```

## Are function objects passed through `addEventListener(..)` safe?

Short answer: no. 

Longer answer. Other scripts with access to the DOM can:

1. trigger most other event listeners from script by dispatching a particular event to it. Thus, when a function is added as an event listeners to the DOM, other scripts can access it.

2. move and restyle an element with event listeners already attached to it. This can fool the user into clicking on an element at the wrong time or place. 

3. override the `addEventListener(..)` property on both the `EventTarget` prototype, the `HTMLElement` prototype or any `EventTarget`object (ie. all elements, documents and windows in the DOM). This would mean that scripts adding their event listeners after another script in the app has run, might inadvertently pass their function objects to that other script.

Thus, by default, developers should consider functions added as event listeners as "open" in the DOM. They most likely can be intercepted and/or manipulated from other scripts with access to that DOM.

## References

 * [MDN: `EventTarget`](https://developer.mozillthea.org/en-US/docs/Web/API/EventTarget)
 * [Google: `getEventListeners(target)`](https://developers.google.com/web/updates/2015/05/get-and-debug-event-listeners)