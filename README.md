# getEventListeners (polyfill)

Polyfill for the getEventListeners method available in dev tools. 

Includes a) extended event listener options such as 'first', 'last' and 'unstoppable' and b) a patch that will scope calls to 'stopPropagation()' to only apply to other event listeners under the same propagation root (ie. under the same ShadowRoot/window). These additions are separated in different modules.

1. [WhatIs EventTarget](1_WhatIs_EventTarget.md)
1. [WhatIs EquivalentEventListener](2_WhatIs_EquivalentEventListener.md)
1. [Why ExtendEventTarget](3_Why_ExtendEventTarget.md)
1. [Pattern EventTargetRegistry](4_Pattern_EventTargetRegistry.md)
1. [Pattern HasAndGetEventListeners](5_Pattern_HasAndGetEventListeners.md)
1. [WhatIs onclickEtc](5b_WhatIs_onclickEtc.md)
1. [Pattern OnceEventListenerOption](6_Pattern_OnceEventListenerOption.md)
1. [Pattern FirstEventListener](7_Pattern_FirstEventListener.md)
1. [Pattern EventListenerPriority](8_Pattern_EventListenerPriority.md)
1. [Pattern Event IsStopped](9_Pattern_Event_IsStopped.md)
1. [Pattern UnstoppableEventListeners](10_Pattern_UnstoppableEventListeners.md)
1. [Pattern LastEventListenerOption](12_Pattern_LastEventListenerOption.md)
1. [Pattern ScopedStopProp](13_Pattern_ScopedStopProp.md)
1. [Pattern GuaranteedBubbleListener](14_Pattern_GuaranteedBubbleListener.md)
1. [Pattern ImmediateOnlyEventListenerOption](15_Pattern_ImmediateOnlyEventListenerOption.md)

## todo 

x. make a chapter about the getEventListeners() method in Chrome dev tools.
y. we need a discussion about the safety of the getEventListeners() method. 
* functions can be retrieved from the dom elements. this means that there source can be printed. to avoid that, wrap them inside anoter function that calls them, or bind them.
* hide the access to the getEventListeners method, do not make it available via the window object for example, but keep its reference locked inside your framework js files.

## how to use it

### 1. Simple `getEventListener(eventTarget)` polyfill
 
The simple `getEventListener(eventTarget)` supports the native `once` event listener option. The ES6 `import` returns an `addEventTargetRegistry()` function that should be run before any event listeners are added to the DOM.  

```javascript
import {addEventTargetRegistry} from "https://cdn.jsdelivr.net/gh/orstavik/getEventListeners@1.0.1/src/getEventListeners_once.js";

window.getEventListeners = addEventTargetRegistry();
```

### 2. `last`, `first`, `unstoppable`, scoped `stopPropagation()` and `getEventListener(eventTarget)` polyfill

To enable full development of web components that act like native web components you MUST have something like this.
 
```javascript
import {addGetEventListeners_allOptions} from "https://cdn.jsdelivr.net/gh/orstavik/getEventListeners@1.1.2/src/getEventListeners_allOptions.js";

const {getEventListeners, isStopped} = addGetEventListeners_allOptions();
```