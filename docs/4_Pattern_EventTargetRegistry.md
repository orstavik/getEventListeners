# Pattern: EventTargetRegistry

The native EventTargetRegistry can be written to using only two methods: `addEventListener(..)` and `removeEventListener(..)`. So, to create a mirror of the EventTargetRegistry, we only need to override these two methods.

## Implementation

The EventTargetRegistry in JS uses a function `findEquivalentListener(...)` to extract the index of any equivalent listener in the EventTargetRegistry. This is important in order to verify if the given event listener can/cannot be added/removed from the EventTargetRegistry. 

In addition, the EventTargetRegistry overrides the `addEventListener(...)` method on the EventTarget prototype. However, it maintains a copy of the original `EventTarget.prototype.addEventListener` and `EventTarget.prototype.removeEventListener` functions so that it is able to pass the event listener into the native event propagation system.

```javascript
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
  this._eventTargetRegistry[name].push(entry);
  ogAdd.call(this, name, listener, options);
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
``` 

## Demo: EventTargetRegistry

```html
<script>
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
    this._eventTargetRegistry[name].push(entry);
    ogAdd.call(this, name, listener, options);
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

<h1>Hello sunshine!</h1>

<script>
  function log1() {
    console.log("one");
  }

  function log2() {
    console.log("two");
  }

  function log3() {
    console.log("three");
  }

  function log4() {
    console.log("four");
  }

  const h1 = document.querySelector("h1");

  h1.addEventListener("click", log1);                        //1. added
  h1.addEventListener("click", log1);                        //2. not added, equals 1
  h1.addEventListener("click", log1.bind({}));               //3. added, log.bind({}) creates a new function object instance
  h1.addEventListener("click", log1, true);                  //4. added, capture phase is not equivalent to bubble phase
  h1.addEventListener("click", log1, {capture: true});       //5. not added, equivalent to 4
  h1.addEventListener("click", log1, {passive: false});      //6. not added, equivalent to 1
  h1.addEventListener("click", log1, {once: true, passive: false, capture: false}); //7. not added, equivalent to 1
  console.log(h1._eventTargetRegistry.click.length);         //3

  h1.addEventListener("click", log2);                        //1. added
  h1.removeEventListener("click", log2, {passive: true});    //removes 1 since the event listeners are equivalent/same phase
  h1.addEventListener("click", log2, {capture: true, once: true}); //2. added
  h1.removeEventListener("click", log2, true);                     //removes 2 since the event listeners are equivalent/same phase
  console.log(h1._eventTargetRegistry.click.length);         //3

  h1.addEventListener("click", log3);                        //1. added
  h1.addEventListener("click", log3, 0);                     //1. not added, 0 => falsy
  h1.addEventListener("click", log3, "");                    //1. not added, "" => falsy
  h1.addEventListener("click", log3, {capture: ""});         //1. not added, "" => falsy
  h1.addEventListener("click", log3, {capture: 0});          //1. not added, 0 => falsy
  console.log(h1._eventTargetRegistry.click.length);         //4

  h1.addEventListener("click", log4, true);                  //1. added
  h1.addEventListener("click", log4, {capture: "a"});        //1. not added, "a" => trueish
  h1.addEventListener("click", log4, 1);                     //1. not added, 1 => trueish
  console.log(h1._eventTargetRegistry.click.length);         //5

  h1.dispatchEvent(new MouseEvent("click", {bubbles: true}));
</script>
```

Result:

```
3
3
4
5
one
one
one
three
four
```




We need to be able to read custom event list properties, rearrange their order, and or trigger different event listeners on different elements.
   
```javascript
function block(e){
  e.stopImmediatePropagation(); 
  e.preventDefault();
}
const missingOption = {
  capture: true, 
  once: true, 
  first: true,            //this option doesn't exist
  onlyImmediately: true   //this option doesn't exist
};
window.addEventListener("click", block, missingOption);
```  


## References

 * [MDN: `EventTarget`](https://developer.mozillthea.org/en-US/docs/Web/API/EventTarget)
 * [Google: `getEventListeners(target)`](https://developers.google.com/web/updates/2015/05/get-and-debug-event-listeners)