# Pattern: ScopedStopProp

`stopPropagation()` is bad when it works *outside* the bounds of the DOM context which the event operates. Ie. `stopPropagation()` is bad when it is CaptureTorpedoed, ShadowTorpedoed, SlotTorpedoed or ReverseSlotTorpedoed 

> ReverseSlotTorpedo is a `stopPropagation()` is called in the lightDOM on the child element which would then propagate up/down to a slotted event listener. For example:
```html
<a href="#go"><h1>hello sunshine</h1></a>
<script>
  h1.addEventListener("click", e=>e.stopPropagation());
  //if a default action is added to the a href as a guaranteedBubbleListener, then
  //calling stopPropagation() on the inner <h1> element will block that from happening.
</script>
```

## Solution: scope the effect of `stopPropagation()`

A solution to this problem is to scope the effect of `stopPropagation()`. This would essentially mean that `stopPropagation()` and `stopImmediatePropagation()` would only block other event listener added to the elements whose rootNode is the same as the event listener calling `stopPropagation()`.

## Implementation

To implement a scoped `stopPropagation()` we would need to patch *three* native methods:
1. `Event.stopPropagation()`
2. `Event.stopImmediatePropagation()`.
3. `EventTarget.addEventListener`

We also need a registry of which calls to `stopPropagation()` and `stopImmediatePropagation()` is necessary for the scoped structure to work. Every time a call to stop propagation is made, a registry of it is made in a two-dimensional `stopProp` map.

```
event => root => whenStopPropWasCalled
whenStopPropWasCalled:
  .stopPropagation() => {currentTarget, eventPhase}
  .stopImmediatePropagation() => true
```

Using this `stopProp` map, the wrapper function around every event listener can check if another event listener has called `stopPropagation()` or `stopImmediatePropagation()` on the same event, *and* in the same DOM context. 

## unstoppable EventListenerOption

In addition to limiting the effect of the scoped eventListenerOption, a new event listener option can be added: `unstoppable`. The unstoppable option will make the event listener unstoppable during execution.

A simple way to make the unstoppable event listener option, is to wrap the event listener callback in a wrapper function for all event listeners that are unstoppable. This will only be done in a few rare instances. It can also be done by simply adding a property to the event listener method. This is more problematic...

 

```javascript
//todo this distinguish between the window and document as propagation roots.
//todo this is not how the platform works today.
//todo don't know which way to land here. If the bounce behavior should be preserved here.
function getCurrentRoot(event) {
  return event.currentTarget.getRootNode ? event.currentTarget.getRootNode() : event.currentTarget;
}

const stopPropagations = new WeakMap();//event => root => whenStopPropWasCalled
                                       //whenStopPropWasCalled:
                                       //  .stopPropagation() => {currentTarget, eventPhase}
                                       //  .stopImmediatePropagation() => true
function stopProp(event, value) {
  let eventToRoot = stopPropagations.get(event);
  if (!eventToRoot)
    stopPropagations.set(event, eventToRoot = new WeakMap());
  const root = getCurrentRoot(event);
  if (value === true || !eventToRoot.has(root))
    eventToRoot.set(root, value);
}
function isCurrentlyStopped(event) {
  const stopProp = stopPropagations.get(event)?.get(getCurrentRoot(event));
  if (!stopProp)
    return false;
  return stopProp === true || stopProp.currentTarget !== event.currentTarget || stopProp.eventPhase !== event.eventPhase;
}
Object.defineProperties(Event.prototype, {
  stopPropagation: {
    value: function () {
      stopProp(this, {currentTarget: this.currentTarget, eventPhase: this.eventPhase});
    }
  },
  stopImmediatePropagation: {
    value: function () {
      stopProp(this, true);
    }
  }
});

const listenerWrappers = new WeakMap();
const original = EventTarget.prototype.addEventListener;
Object.defineProperty(EventTarget.prototype, "addEventListener", {
  value: function (type, cb, options) {
    let wrapped = listenerWrappers.get(cb);
    const unstoppable = options?.unstoppable;
    if (!wrapped) {
      wrapped = function (e) {
        if (unstoppable || !isCurrentlyStopped(e)) 
          return cb.call(this, e);
      };
      listenerWrappers.set(cb, wrapped);
    }
    original.call(this, type, wrapped, options);
  }
});
```

## demo

```html
<script>
  (function () {

    //todo this distinguish between the window and document as propagation roots.
    //todo this is not how the platform works today.
    //todo don't know which way to land here. If the bounce behavior should be preserved here.
    function getCurrentRoot(event) {
      return event.currentTarget.getRootNode ? event.currentTarget.getRootNode() : event.currentTarget;
    }

    const stopPropagations = new WeakMap();
                                          
    function stopProp(event, value) {
      let eventToRoot = stopPropagations.get(event);
      if (!eventToRoot)
        stopPropagations.set(event, eventToRoot = new WeakMap());
      const root = getCurrentRoot(event);
      if (value === true || !eventToRoot.has(root))
        eventToRoot.set(root, value);
    }

    function isCurrentlyStopped(event) {
      const stopProp = stopPropagations.get(event)?.get(getCurrentRoot(event));
      if (!stopProp)
        return false;
      return stopProp === true || stopProp.currentTarget !== event.currentTarget || stopProp.eventPhase !== event.eventPhase;
    }

    Object.defineProperties(Event.prototype, {
      stopPropagation: {
        value: function () {
          stopProp(this, {currentTarget: this.currentTarget, eventPhase: this.eventPhase});
        }
      },
      stopImmediatePropagation: {
        value: function () {
          stopProp(this, true);
        }
      }
    });

    const listenerWrappers = new WeakMap();

    const original = EventTarget.prototype.addEventListener;
    Object.defineProperty(EventTarget.prototype, "addEventListener", {
      value: function (type, cb, options) {
        let wrapped = listenerWrappers.get(cb);
        const unstoppable = options?.unstoppable;
        if (!wrapped) {
          wrapped = function (e) {
            if (unstoppable || !isCurrentlyStopped(e)) 
              return cb.call(this, e);
          };
          listenerWrappers.set(cb, wrapped);
        }
        original.call(this, type, wrapped, options);
      }
    });
  })();
</script>

<inner-comp></inner-comp>

<script>
  class InnerComp extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      const sr = this.shadowRoot;
      sr.innerHTML = `<h1>hello sunshine</h1>`;
      const h1 = sr.children[0];

      sr.addEventListener("click", e => console.log("inner1", e.currentTarget, e.eventPhase), true);
      h1.addEventListener("click", e => console.log("inner2", e.currentTarget, e.eventPhase));
      h1.addEventListener("click", e => e.stopPropagation());
      h1.addEventListener("click", e => console.log("inner3", e.currentTarget, e.eventPhase, "capture"), true);
      h1.addEventListener("click", e => e.stopImmediatePropagation());
      h1.addEventListener("click", e => console.log("oopss", e.currentTarget, e.eventPhase), true);
      sr.addEventListener("click", e => console.log("oopss2", e.currentTarget, e.eventPhase));
    }
  }

  customElements.define("inner-comp", InnerComp);

  const innerComp = document.querySelector("inner-comp");
  window.addEventListener("click", e => console.log("outer1", e.currentTarget, e.eventPhase), true);
  innerComp.addEventListener("click", e => console.log("outer3", e.currentTarget, e.eventPhase));
  innerComp.addEventListener("click", e => console.log("outer2", e.currentTarget, e.eventPhase), true);
  window.addEventListener("click", e => console.log("outer4", e.currentTarget, e.eventPhase));

</script>
``` 

## References

 * [discussion about closed shadowDOM intention](https://github.com/w3c/webcomponents/issues/378#issuecomment-179596975)
