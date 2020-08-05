// let res;

export const testRegistry = [{
  name: " registry 1: adding one event listener",
  fun: function (res) {
    const dom = document.createElement("h1");

    function cb(e) {
      res.push("!");
    }

    dom.addEventListener("click", cb);
    res.push(getEventListeners(dom, "click").length);
    dom.dispatchEvent(new Event("click"));
  },
  expect: "1!",
  // result: function () {
  //   return res;
  // }
}, {
  name: "registry 2: removeEventListener",
  fun: function (res) {

    function cb(e) {
      res.push("!");
    }

    const dom = document.createElement("h1");
    dom.addEventListener("click", cb);
    const eventListeners = getEventListeners(dom, "click");
    const listenerObject = eventListeners[0];
    res.push("" + eventListeners.length + listenerObject?.removed);
    dom.removeEventListener("click", cb);
    res.push(getEventListeners(dom, "click").length);
    res.push(listenerObject?.removed);
    dom.dispatchEvent(new Event("click"));
  },
  expect: "1false0true",
  // result: function () {
  //   return res;
  // }
}];