export const testRegistry = [{
  name: " registry 1: adding one event listener",
  fun: function (res) {
    const h1 = document.createElement("h1");

    function cb(e) {
      res.push("!");
    }

    h1.addEventListener("click", cb);
    res.push(customGetEventListeners(h1, "click").length);
    h1.dispatchEvent(new Event("click"));
  },
  expect: "1!",
}, {
  name: "registry 2: removeEventListener",
  fun: function (res) {

    function cb(e) {
      res.push("!");
    }

    const h1 = document.createElement("h1");
    h1.addEventListener("click", cb);
    const eventListeners = customGetEventListeners(h1, "click");
    const listenerObject = eventListeners[0];
    res.push("" + eventListeners.length + listenerObject.removed);
    h1.removeEventListener("click", cb);
    res.push(customGetEventListeners(h1, "click").length);
    res.push(listenerObject?.removed);
    h1.dispatchEvent(new Event("click"));
  },
  expect: "1false0true",
}];