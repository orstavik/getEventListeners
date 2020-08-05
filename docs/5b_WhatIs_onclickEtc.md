# WhatIs: `.onclick` etc.?

`window`, `document`, and `HTMLElement` has a looooong series of methods that begin with `on` and ends with the name of a native event: 
 * `onclick`, 
 * `onresize`, 
 * `onanimationend`, 
 * etc. etc. etc.
 
These methods come from the `GlobalEventHandler` mixin which both `window` object and the `Document` and `HTMLElement` prototypes implement. Unlike the `EventTarget` interface, it is not part of the prototype chain directly. Thus, to implement them, we also create a mixin that in principle slapp the methods onto a group of existing objects/prototype objects. 
 
## How does `onclick` etc. work?

In the demo below we are going to look at a small experiment. The purpose of this demo is to illustrate how `onclick` uses `addEventListener` in the background. 

```html
<h1>
  <span>Click me twice!</span>
</h1>

<script>
  function log1(e) {
    console.log(e.type + " one");
  }

  function log2(e) {
    console.log(e.type + " two");
  }

  function log3(e) {
    console.log(e.type + " three");
  }

  function log4(e) {
    console.log(e.type + " four");
  }

  function log5(e) {
    console.log(e.type + " five");
  }

  const h1 = document.querySelector("h1");
  const span = document.querySelector("span");

  h1.addEventListener("mousemove", log1);
  h1.onmousemove = log1;
  span.dispatchEvent(new MouseEvent("mousemove", {bubbles: false}));
  //prints nothing
  console.log("----------");

  h1.addEventListener("click", log1);
  h1.onclick = log1;
  span.dispatchEvent(new MouseEvent("click", {bubbles: true}));
  //click one
  //click one
  console.log("----------");

  h1.addEventListener("dblclick", log1);
  h1.ondblclick = log2;
  h1.addEventListener("dblclick", log3);
  span.dispatchEvent(new MouseEvent("dblclick", {bubbles: true}));
  //click one
  //click two
  //click three
  console.log("----------");

  h1.addEventListener("mouseup", log1);
  h1.onmouseup = log2;
  h1.addEventListener("mouseup", log3);
  h1.onmouseup = log4;
  span.dispatchEvent(new MouseEvent("mouseup", {bubbles: true}));
  //click one
  //click four
  //click three
  console.log("----------");

  h1.addEventListener("auxclick", log1);
  h1.onauxclick = log2;
  h1.addEventListener("auxclick", log3);
  h1.onauxclick = undefined;
  h1.addEventListener("auxclick", log4);
  h1.onauxclick = log5;
  span.dispatchEvent(new MouseEvent("auxclick", {bubbles: true}));
  //click one
  //click two
  //click four
  //click five
  console.log("----------");
</script>
```
Results: 
```
----------
click one
click one
----------
dblclick one
dblclick two
dblclick three
----------
mouseup one
mouseup four
mouseup three
----------
auxclick one
auxclick three
auxclick four
auxclick five
----------
```

1. The **onevent** handlers are added as **bubbling phase** event listeners **only**. We can see that as nothing is logged from the first mousemove test.  

2. The exact same function can be added via both the onevent handler and `addEventListener(...)`. This is illustrated by the two "click one" of the second click test.

3. The order of the onevent handler follows the same insertion order as event listeners added using the `addEventListener(..)` method. This *strongly* suggests that the onevent handlers relies on the `EventTarget` API in the background. This is illustrated by the third dblclick test.

4. If you change an event handler to another event handler, then the insertion order of the *first* onevent handler *still applies*! This means that the onevent handler most likely is a setter function that does not remove the first event listener, but simply replaces the callback variable that the onevent listener applies. This is illustrated by the forth mouseup test.

5. But. If you set the onevent handler to falsy (ie. `null` or `undefined`), then the event listener is removed. This means that the getter function also removes the event listener. This is illustrated by the fifth auxclick test.

## Implementation

The basic functionality of the getter and setter of `onclick`, `ondblclick`, and `onauxclick` is described below. The demo is implemented as a Mixin, that overwrites existing methods on the `window` object and the `HTMLElement` and `Document` prototype objects.

```javascript
  const events = ["click", "dblclick", "auxclick"];

  function onEventHandlerMixin(target){
    for (let eventName of events) {
      let cb;
      let wrapper = function(e){
        cb(e);
      };
      Object.defineProperty(target, "on" + eventName, {
        get : function () {
          return cb;
        },
        set : function (newCb) {
          if (!newCb && cb)
            this.removeEventListener(eventName, wrapper/*, false*/);
          else if (newCb && !cb)
            this.addEventListener(eventName, wrapper/*, false*/);
          cb = newCb;
        }
      });
    }
  }
```

## Demo: Connect GlobalEventHandlers to custom EventTargetRegistry

```html
<script>
  const ogAdd = EventTarget.prototype.addEventListener;
  const ogRemove = EventTarget.prototype.removeEventListener;

  EventTarget.prototype.addEventListener = function (name, listener, options) {
    console.log("addEventListener for " + name);
    ogAdd.call(this, name, listener, options);
  };

  EventTarget.prototype.removeEventListener = function (name, listener, options) {
    console.log("removeEventListener for " + name);
    ogRemove.call(this, name, listener, options);
  };

  const events = ["click", "dblclick", "auxclick"];

  function onEventHandlerMixin(target) {
    for (let eventName of events) {
      let cb;
      let wrapper = function (e) {
        cb(e);
      };
      Object.defineProperty(wrapper, "name", {
        writable: false,
        enumerable: false,
        configurable: true,
        value: "on" + eventName + "Handler"
      });
      Object.defineProperty(target, "on" + eventName, {
        get: function () {
          return cb;
        },
        set: function (newCb) {
          if (!newCb && cb)
            this.removeEventListener(eventName, wrapper/*, false*/);
          else if (newCb && !cb)
            this.addEventListener(eventName, wrapper/*, false*/);
          cb = newCb;
        }
      });
    }
  }

  onEventHandlerMixin(HTMLElement.prototype);
  onEventHandlerMixin(Document.prototype);
  onEventHandlerMixin(window);  //window object, not prototype!
</script>

<h1>
  <span>Click me twice!</span>
</h1>

<script>
  function log1(e) {
    console.log(e.type + " one");
  }

  function log2(e) {
    console.log(e.type + " two");
  }

  function log3(e) {
    console.log(e.type + " three");
  }

  function log4(e) {
    console.log(e.type + " four");
  }

  function log5(e) {
    console.log(e.type + " five");
  }

  function logDoc(e){
    console.log("_D_ocument");
  }

  function logWin(e){
    console.log("_w_indow");
  }

  const h1 = document.querySelector("h1");
  const span = document.querySelector("span");

  h1.addEventListener("click", log1);
  h1.onclick = log2;
  h1.addEventListener("click", log3);
  span.dispatchEvent(new MouseEvent("click", {bubbles: true}));
  //click one
  //click two
  //click three
  console.log("----------");

  h1.addEventListener("dblclick", log1);
  h1.ondblclick = log2;
  h1.addEventListener("dblclick", log3);
  h1.ondblclick = log4;
  span.dispatchEvent(new MouseEvent("dblclick", {bubbles: true}));
  //click one
  //click four
  //click three
  console.log("----------");

  h1.addEventListener("auxclick", log1);
  h1.onauxclick = log2;
  h1.addEventListener("auxclick", log3);
  h1.onauxclick = undefined;
  h1.addEventListener("auxclick", log4);
  h1.onauxclick = log5;
  span.dispatchEvent(new MouseEvent("auxclick", {bubbles: true}));
  //click one
  //click three
  //click four
  //click five
  console.log("----------");

  window.onclick = logWin;
  document.onclick = logDoc;
  document.body.dispatchEvent(new MouseEvent("click", {bubbles: true}));
  //_D_ocument
  //_w_indow
  console.log("----------");
</script>
```  

Result:

```
addEventListener for click
addEventListener for click
addEventListener for click
click one
click two
click three
----------
addEventListener for dblclick
addEventListener for dblclick
addEventListener for dblclick
dblclick one
dblclick four
dblclick three
----------
addEventListener for auxclick
addEventListener for auxclick
addEventListener for auxclick
removeEventListener for auxclick
addEventListener for auxclick
addEventListener for auxclick
auxclick one
auxclick three
auxclick four
auxclick five
----------
addEventListener for click
addEventListener for click
_D_ocument
_w_indow
----------
```

## References

 * []()