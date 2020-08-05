# WhatIs: Equivalent event listeners?

To better understand how `addEventListener(..)` and `removeEventListener(..)` works, we need to ask and answer a few simple questions:

1. Can I add the same event listener twice to the same element?
2. How are options treated when I remove an event listener from an element?

## Demo: listening twice or not at all

```html
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

  h1.addEventListener("click", log2);                        //1. added
  h1.removeEventListener("click", log2, {passive: true});    //removes 1 since the event listeners are equivalent/same phase
  h1.addEventListener("click", log2, {capture: true, once: true}); //2. added
  h1.removeEventListener("click", log2, true);                     //removes 2 since the event listeners are equivalent/same phase

  h1.addEventListener("click", log3);                        //1. added
  h1.addEventListener("click", log3, 0);                     //1. not added, 0 => falsy
  h1.addEventListener("click", log3, "");                    //1. not added, "" => falsy
  h1.addEventListener("click", log3, {capture: ""});         //1. not added, "" => falsy
  h1.addEventListener("click", log3, {capture: 0});          //1. not added, 0 => falsy

  h1.addEventListener("click", log4, true);                  //1. added
  h1.addEventListener("click", log4, {capture: "a"});        //1. not added, "a" => trueish
  h1.addEventListener("click", log4, 1);                     //1. not added, 1 => trueish

  h1.dispatchEvent(new MouseEvent("click", {bubbles: true}));
</script>
```

Result: 

```
one
one
one
three
four
```

1. You can add only *one* event listener to an element object with:
   * the exact same function object as callback and
   * the same boolean `capture` value.

2. When you remove an event listener from an element, then
   * the callback function must be the same object and
   * the `capture` value must match.

We can therefore say that two event listeners (callback + options pairs) are equivalent when:
1. their callback function is the exact same object, and
2. they yield the same boolean capture value.  

## Implementation: Equivalent event listeners

```javascript
function equivalentListeners(funA, optionsA, funB, optionsB){ 
  if (funA !== funB)
    return false;
  if (optionsA instanceof Object)
    optionsA = optionsA.capture;
  if (optionsB instanceof Object)
    optionsB = optionsB.capture;
  return !!optionsA === !!optionsB;
}
```    

## References

  * [MDN: `addEventListener(..)`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)
  * [MDN: `removeEventListener(..)`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener)
