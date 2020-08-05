# Pattern: `Event.isStopped`

When implementing custom control of event propagation, it is often useful to know if the event has been stopped or not. In this chapter we add an `.isStopped` property to the `Event` interface to report back the state of the propagation.

There are a couple of things to make note of:
1. if you call `stopPropagation()` first, then the event is only blocked from propagating to the next `currentTarget`, not to the next event listener on the same `currentTarget`. Therefore, the `stopImmediatePropagation()` can *override* the `stopPropagation()` method, but not the other way round.
2. In this implementation, `isStopped` returns `false` even though an event listener has called `stopPropagation()` on the event previously, as long as the event remains on the same `currentTarget`. This is useful for our use of the `isStopped` in the subsequent chapter, but is a bit counter intuitive when `isStopped` is viewed in isolation.

## Implementation

```javascript
const isStoppedSymbol = Symbol("isStoppedSymbol");
const ogStopPropagation = Event.prototype.stopPropagation;
const ogStopImmediatePropagation = Event.prototype.stopImmediatePropagation;
Object.defineProperties(Event.prototype, {
  "isStopped": {
    get: function () {
      return (this[isStoppedSymbol] && this[isStoppedSymbol] !== this.currentTarget) || false;
    }
  },
  "stopPropagation": {
    value: function () {
      this[isStoppedSymbol] || (this[isStoppedSymbol] = this.currentTarget);
      ogStopPropagation.call(this);
    }
  },
  "stopImmediatePropagation": {
    value: function () {
      this[isStoppedSymbol] = true;
      ogStopImmediatePropagation.call(this);
    }
  }
});
```

## Demo: Event.isStopped

```html
<script>
  (function () {
    //Implementing isStopped property
    const isStoppedSymbol = Symbol("isStoppedSymbol");

    const ogStopPropagation = Event.prototype.stopPropagation;
    const ogStopImmediatePropagation = Event.prototype.stopImmediatePropagation;
    Object.defineProperties(Event.prototype, {
      "isStopped": {
        get: function () {
          return (this[isStoppedSymbol] && this[isStoppedSymbol] !== this.currentTarget) || false;
        }
      },
      "stopPropagation": {
        value: function () {
          this[isStoppedSymbol] || (this[isStoppedSymbol] = this.currentTarget);
          ogStopPropagation.call(this);
        }
      },
      "stopImmediatePropagation": {
        value: function () {
          this[isStoppedSymbol] = true;
          ogStopImmediatePropagation.call(this);
        }
      }
    });
  })();
</script>

<h1>hello sunshine</h1>
<h2>hello world</h2>

<script>
  const h1 = document.querySelector("h1");
  const h2 = document.querySelector("h2");

  h1.addEventListener("click", e => console.log("isStopped: ", e.isStopped, " (obvious answer to this question)"));
  h1.addEventListener("click", e => e.stopPropagation());
  h1.addEventListener("click", e => console.log("isStopped: ", e.isStopped, " (obvious answer to this question)"));
  h1.addEventListener("click", e => {
    e.stopImmediatePropagation();
    console.log("isStopped: ", e.isStopped, " (and now the next event listener will not run).");
  });
  h1.addEventListener("click", e => console.log("i will never run. "));

  h2.addEventListener("click", e => console.log("isStopped: ", e.isStopped));
  h2.addEventListener("click", e => e.stopPropagation());
  h2.addEventListener("click", e => console.log("isStopped: ", e.isStopped));
  window.addEventListener("click", e => console.log("i will never run. "));
</script>
```

## References

 * 