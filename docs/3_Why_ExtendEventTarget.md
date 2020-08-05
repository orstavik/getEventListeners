# Why: Extend `EventTarget`?

There are some use cases for extending the `EventTarget` interface. For example:

1. `getEventListeners(target)`. In Chrome dev tools there is a particular method for debugging event listeners called `getEventListeners(target)`. This method is only available from within Chrome dev tools, and can be used to debug and discover the event listeners added to a particular target.

2. Custom event propagation algorithms, ie. custom `dispatchEvent(..)` alternatives. For example, you might wish to have:
    
     1. **event broadcast**, an event that is dispatched to all elements in the DOM that listens for it.
     2. **target only** propagation, that not only skips the bubbling phase, but also the capture phase.
     3. **slow propagation**, event propagation that is given lower priority in the event loop.
     4. **CSS based propagation**, event propagation that is not target according to the DOM hierarchy, but that hits elements that conform to a certain CSS querySelector.
     5. **`dispatchEventAsync()`**, a copy of the browsers native, async event propagation function. In the next chapter we will re-implement this event propagation algorithms in JS. For us, it is primarily a teaching tool. But some custom events might benefit greatly from async propagation, so this might be something you need to use in production.  
     * And more.
     
   To make your own custom event propagation functions, all you really need is access to the EventTargetRegistry. 

3. Custom event listener options. Currently, event listeners' provide three options: `useCapture`, `passive` and `once`. But, what if you wanted to extend with new event listener options?
   * `addEventListener(..., {first: true})`. What about adding an event listener who should be run *first* on the current event target for the given event type? As scripts are allowed to load and run asynchronously, you are no longer in control of their order of insertion and therefore might need to control their position in the EventTargetRegistry manually.
   * `addEventListener(..., {onlyImmediately: true})`. What about adding an event listener who should run on the given event type *only* if the event is already queued in the event loop by the browser? Certain native events such as `click`, `dblclick`, and `contextmenu` can be added to the event loop at a very early point. These events cannot be prevented using `mouseup.preventDefault()`, and therefore being able to dictate that the next listener for `click` should only be triggered iff it has already been added to the event loop, is useful in order to build and control other, complex mouse or touch based gestures. 

## HowTo: Extend `EventTarget`?

In order to extend the `EventTarget`, we need:

1. access to the EventTargetRegistry. Accessing the native EventTargetRegistry is not possible, so what we must do instead is duplicate and control the registry in JS, and then use the native EventTargetRegistry as a mirror for the native event propagation functions.

2. In order to create custom event propagation methods, we need to be able to:
   * query the EventTargetRegistry and
   * iterate over the list of event listeners 

3. In order to create custom event listener options, we must be able to intercept the `addEventListener(...)` method and then access the EventTargetRegistry if needed.

## References

 * [MDN: `EventTarget`](https://developer.mozillthea.org/en-US/docs/Web/API/EventTarget)
 * [Google: `getEventListeners(target)`](https://developers.google.com/web/updates/2015/05/get-and-debug-event-listeners)