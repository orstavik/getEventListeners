# Pattern: UnstoppableEventListener

//todo this is old. The new ScopedStopPropagation replace this chapter.

The event listener option `{unstoppable: true}` ensures that event listeners added with this option will not be blocked when a previous event listener calls `stopPropagation()` or `stopImmediatePropagation()`.

## Why? When do we need `unstoppable` event listeners?

We need for `unstoppable` event listeners to avoid stopPropagationTorpedoes. The stopPropagation torpedoes is especially troublesome when you are adding event listeners for composed: true events inside the shadowDOM of a closed web component.
 
All web components must listen for composed: false events from within their shadowDOM. Obviously. But closed web component *must* also listen for the composed: true events from within their shadowDOM in order to know *which* element inside the shadowDOM that was targeted. For example, a `click` on one of two `<div>` elements inside a shadowDOM will need to read the inside target of the `click` event's propagation path, and this target is only accesible for event listeners added to a shadowDOM eventTarget.

`unstoppable` enables the event system to ensure that no accidental `stopPropagation()` in the `capture` phase blocks the event *before* it reaches the closed shadowRoot.

An alternative practice is to by convention do:
1. Never call `stopPropagation()` on events in the capture phase, unless you also intend and do call `preventDefault()`.
2. Never call `stopPropagation()` on an event inside a shadowRoot. This will cause strange behavior.
3. If default actions are to be added by web components, `stopPropagation()` anywhere will also mean `preventDefault()`.

## Implementation

To implement the `unstoppable` event listener option we need to override both the `Event.stopPropagation()` methods *and* the `EventTarget.addEventListener()` method. We do so by implementing a version of the `Event.isStopped` pattern that doesn't call the underlying, native `stopPropagation()` methods. We then wrap all event listener callback functions in a wrapper function that checks if the event has been stopped or not. 

```javascript
//Event.isStopped and block the native stopPropagation() methods.
const isStoppedSymbol = Symbol("isStoppedSymbol");
Object.defineProperties(Event.prototype, {
  "isStopped": {
    get: function () {
      return (this[isStoppedSymbol] && this[isStoppedSymbol] !== this.currentTarget) || false;
    }
  },
  "stopPropagation": {
    value: function () {
      this[isStoppedSymbol] || (this[isStoppedSymbol] = this.currentTarget);
    }
  },
  "stopImmediatePropagation": {
    value: function () {
      this[isStoppedSymbol] = true;
    }
  }
});
//Custom check of isStopped by wrapping all event listeners in a custom function that checks
//event.isStopped and options.unstoppable before running.
const cbToWrapperBubble = new WeakMap();//cache of wrapper functions (bubble listeners)
const cbToWrapperCapture = new WeakMap();//cache of wrapper functions (capture listeners)
const ogAdd = EventTarget.prototype.addEventListener;
Object.defineProperty(EventTarget.prototype, "addEventListener", {
  value: function (type, cb, options) {
    const cbToWrapper = (!options || (options instanceof Object) && !options.capture) ?
      cbToWrapperBubble :
      cbToWrapperCapture;
    let wrapper = cbToWrapper.get(cb);
    if (!wrapper) {
      const unstoppable = options?.unstoppable;
      wrapper = function (event) {
        (!event.isStopped || unstoppable) && cb(event);
      };
      cbToWrapper.set(cb, wrapper);
    }
    ogAdd.call(this, type, wrapper, options);
  }
});
```
Note: we need to ensure that the same wrapper function object is used for the same event listener callback, so that a new wrapper will not be created for the same object which would lead the underlying event listener system to possibly add multiple, duplicate event listeners. In addition, as the same listener function object will be added if their `capture` property differs, two `WeakMap()` caches must be used.  

## Demo: unstoppable in the lightDOM

```html
<script>
  (function () {

    const isStoppedSymbol = Symbol("isStoppedSymbol");
    Object.defineProperties(Event.prototype, {
      "isStopped": {
        get: function () {
          return (this[isStoppedSymbol] && this[isStoppedSymbol] !== this.currentTarget) || false;
        }
      },
      "stopPropagation": {
        value: function () {
          this[isStoppedSymbol] || (this[isStoppedSymbol] = this.currentTarget);
        }
      },
      "stopImmediatePropagation": {
        value: function () {
          this[isStoppedSymbol] = true;
        }
      }
    });

    // overriding the stopPropagation logic by wrapping all functions in wrapper method
    // the weakMaps preserves all wrappers for the same function objects, so that the event listener functions appear
    // for the underlying event propagation system similarly as before.
    const cbToWrapperBubble = new WeakMap();
    const cbToWrapperCapture = new WeakMap();

    const ogAdd = EventTarget.prototype.addEventListener;
    Object.defineProperty(EventTarget.prototype, "addEventListener", {
      value: function (type, cb, options) {
        const cbToWrapper = (!options || (options instanceof Object) && !options.capture) ?
          cbToWrapperBubble :
          cbToWrapperCapture;
        let wrapper = cbToWrapper.get(cb);
        if (!wrapper) {
          wrapper = function (event) {
            (!event.isStopped || options?.unstoppable) && cb(event);
          };
          cbToWrapper.set(cb, wrapper);
        }
        ogAdd.call(this, type, wrapper, options);
      }
    });
  })();
</script>

<div id="a">
  <div id="b">
    <div id="c">
      hello sunshine
    </div>
  </div>
</div>

<script>
  const a = document.querySelector("#a");
  const b = document.querySelector("#b");
  const c = document.querySelector("#c");

  function aOnce() {
    console.log("five, this should be only once, at the end")
  }

  a.addEventListener("click", e => console.log("one"), true);
  a.addEventListener("click", e => e.stopPropagation(), true);
  a.addEventListener("click", e => console.log("two"), true);
  a.addEventListener("click", e => e.stopImmediatePropagation(), true);
  a.addEventListener("click", aOnce, true);
  b.addEventListener("click", e => console.log("three"), {unstoppable: true, capture: true});
  c.addEventListener("click", e => console.log("---"), {capture: true});

  c.addEventListener("click", e => console.log("---"));
  b.addEventListener("click", e => console.log("four"), {unstoppable: true});
  a.addEventListener("click", aOnce, {unstoppable: true});
</script>
```

## Demo: Unstoppable in the shadowDOM

```html
<script>
  (function () {

    const isStoppedSymbol = Symbol("isStoppedSymbol");
    Object.defineProperties(Event.prototype, {
      "isStopped": {
        get: function () {
          return (this[isStoppedSymbol] && this[isStoppedSymbol] !== this.currentTarget) || false;
        }
      },
      "stopPropagation": {
        value: function () {
          this[isStoppedSymbol] || (this[isStoppedSymbol] = this.currentTarget);
        }
      },
      "stopImmediatePropagation": {
        value: function () {
          this[isStoppedSymbol] = true;
        }
      }
    });

    // overriding the stopPropagation logic by wrapping all functions in wrapper method
    // the weakMaps preserves all wrappers for the same function objects, so that the event listener functions appear
    // for the underlying event propagation system similarly as before.
    const cbToWrapperBubble = new WeakMap();
    const cbToWrapperCapture = new WeakMap();

    const ogAdd = EventTarget.prototype.addEventListener;
    Object.defineProperty(EventTarget.prototype, "addEventListener", {
      value: function (type, cb, options) {
        const cbToWrapper = (!options || (options instanceof Object) && !options.capture) ?
          cbToWrapperBubble :
          cbToWrapperCapture;
        let wrapper = cbToWrapper.get(cb);
        if (!wrapper) {
          wrapper = function (event) {
            (!event.isStopped || options?.unstoppable) && cb(event);
          };
          cbToWrapper.set(cb, wrapper);
        }
        ogAdd.call(this, type, wrapper, options);
      }
    });
  })();
</script>


<script>
  class ClosedComp extends HTMLElement {
    constructor() {
      super();
      const shadow = this.attachShadow({mode: "closed"});
      shadow.innerHTML = `<div>Hello Sunshine</div>`;
      shadow.children[0].addEventListener("click", e => console.log("unstoppable!!", e.composedPath()), {unstoppable: true});
    }
  }

  customElements.define("closed-comp", ClosedComp);
</script>
<closed-comp></closed-comp>

<script>
  window.addEventListener("click", e => console.log("click began propagation.", e.composedPath()), true);
  window.addEventListener("click", e => e.stopPropagation(), true);
  window.addEventListener("click", e => console.log("click has stopped propagation.", e.composedPath()), true);
  //unstoppable!! will be written out still
</script>
```

## References

 * [discussion about closed shadowDOM intention](https://github.com/w3c/webcomponents/issues/378#issuecomment-179596975)
