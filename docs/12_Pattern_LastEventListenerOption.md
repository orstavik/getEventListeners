# Pattern: `EventListenerOption: last` 

`last` is an event listener option that ensures that the event listener is always called last on the current eventTarget in either the capture or the at-target phase. It is quite light and simple to implement.

## Solution

To ensure that an event listener runs last, we simply add two properties for each event name on each event target for either the bubble or the capture phase. 

```javascript
//target => "eventName"/"eventName capture" => {cb, options}
const targetTypeLast = new WeakMap();

function getLast(target, type, cb, options){
  const capture = options instanceof Object ? options.capture : !!options;
  const lookupName = capture ? type + " capture" : type;
  return targetTypeLast.get(target)?.get(lookupName);
}

function setLast(target, type, cb, options){
  const capture = options instanceof Object ? options.capture : !!options;
  const lookupName = capture ? type + " capture" : type;
  let targetsMap = targetTypeLast.get(target);
  if (!targetsMap)
    targetTypeLast.set(target, targetsMap = new HashMap());
  targetsMap.set(lookupName, {cb, options});
}

const original = EventTarget.prototype.addEventListener;
Object.defineProperty(EventTarget.prototype, "addEventListener", {
  value: function(type, cb, options) {
    const oldLast = getLast(this, type, options);
    if (options?.last && oldLast)
        throw new Error("only one last event listener can be added to a target for an event type at a time.");
    if (options?.last){
      setLast(this, type, cb, options);
      return original.call(this, type, cb, options);
    } 
    if (oldLast){
      this.removeEventListener(type, oldLast.cb, oldLast.options);
      const res = original.call(this, type, cb, options);
      original.call(this, type, oldLast.cb, oldLast.options);
      return res;
    }    
    return original.call(this, type, cb, options);
  }
});
```

## problem: `last: true` && `once: true`...

```javascript
//target => "eventName"/"eventName capture" => {cb, options}
const targetTypeLast = new WeakMap();

function getLast(target, type, cb, options){
  const capture = options instanceof Object ? options.capture : !!options;
  const lookupName = capture ? type + " capture" : type;
  return targetTypeLast.get(target)?.get(lookupName);
}

function setLast(target, type, cb, options){
  const capture = options instanceof Object ? options.capture : !!options;
  const lookupName = capture ? type + " capture" : type;
  let targetsMap = targetTypeLast.get(target);
  if (!targetsMap)
    targetTypeLast.set(target, targetsMap = new WeakMap());
  if (options.once){                             //once
    const og = cb;                               //once
    const me = this;                             //once
    cb = function(e) {                           //once
      me.removeEventListener(type, cb, options); //once
      og.call(this, e);                          //once
    };                                           //once
  }                                              //once
  targetsMap.set(lookupName, {cb, options})
  return cb;                                     //once
}

const original = EventTarget.prototype.addEventListener;
Object.defineProperty(EventTarget.prototype, "addEventListener", {
  value: function(type, cb, options) {
    const oldLast = getLast(this, type, options);
    if (options?.last && oldLast)
        throw new Error("only one last event listener can be added to a target for an event type at a time.");
    if (options?.last) {
      cb = setLast(this, type, cb, options);
      return original.call(this, type, cb, options);
    } 
    if (oldLast){
      this.removeEventListener(type, oldLast.cb, oldLast.options);
      const res = original.call(this, type, cb, options);
      original.call(this, type, oldLast.cb, oldLast.options);
      return res;
    }    
    return original.call(this, type, cb, options);
  }
});

const original2 = EventTarget.prototype.addEventListener;
Object.defineProperty(EventTarget.prototype, "removeEventListener", {
  value: function(type, cb, options) {
    const last = getLast(this, type, cb, options);
    cb = last? last.cb : cb;
    original2.call(this, type, cb, options);
  }
});
```

## References

 * 