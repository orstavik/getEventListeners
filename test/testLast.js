import {cleanDom} from "./useCase1.js";

export const lastTest = [{
  name: "last is true: {last: true}",
  fun: function (res) {
    const h1 = document.createElement("h1");
    h1.addEventListener("click", e => res.push("a"), {last: true});
    h1.addEventListener("click", e => res.push("b"));
    h1.dispatchEvent(new MouseEvent("click"));
  },
  expect: "ba"
}, {
  name: "last:adding the same function object with last: true twice",
  fun: function (res) {
    function a(e) {
      res.push("a");
    }

    let dom = cleanDom();
    dom.div.addEventListener("click", a, {last: true});
    dom.div.addEventListener("click", a, {last: true});
    dom.div.dispatchEvent(new Event("click", {bubbles: true}));
  },
  expect: "a"
}, {
  name: "last is true: {last: 1}",
  fun: function (res) {
    function a(e) {
      res.push("a");
    }

    function b(e) {
      res.push("b");
    }

    const h1 = document.createElement("h1");
    h1.addEventListener("click", a, {last: 1});
    h1.addEventListener("click", b);
    h1.dispatchEvent(new MouseEvent("click"))
  },
  expect: "ba"
}, {
  name: "last is true: {last: []}",
  fun: function (res) {
    function a(e) {
      res.push("a");
    }

    function b(e) {
      res.push("b");
    }

    const h1 = document.createElement("h1");
    h1.addEventListener("click", a, {last: []});
    h1.addEventListener("click", b);
    h1.dispatchEvent(new MouseEvent("click"))
  },
  expect: "ba"
}, {
  name: "last is false: {last: false}",
  fun: function (res) {
    function a(e) {
      res.push("a");
    }

    function b(e) {
      res.push("b");
    }

    const h1 = document.createElement("h1");
    h1.addEventListener("click", a, {last: false});
    h1.addEventListener("click", b);
    h1.dispatchEvent(new MouseEvent("click"));
  },
  expect: "ab"
}, {
  name: "last is false: {last: 0}",
  fun: function (res) {
    function a(e) {
      res.push("a");
    }

    function b(e) {
      res.push("b");
    }

    const h1 = document.createElement("h1");
    h1.addEventListener("click", a, {last: 0});
    h1.addEventListener("click", b);
    h1.dispatchEvent(new MouseEvent("click"));
  },
  expect: "ab"
}, {
  name: "last is false: {last: ''}",
  fun: function (res) {
    function a(e) {
      res.push("a");
    }

    function b(e) {
      res.push("b");
    }

    const h1 = document.createElement("h1");
    h1.addEventListener("click", a, {last: ''});
    h1.addEventListener("click", b);
    h1.dispatchEvent(new MouseEvent("click"));
  },
  expect: "ab"
}, {
  name: "last: removeEventListener twice",
  fun: function (res) {
    function a(e) {
      res.push("a");
    }

    function b(e) {
      res.push("b");
    }

    const h1 = document.createElement("h1");
    h1.addEventListener("click", a, {last: true});
    h1.removeEventListener("click", a);
    h1.addEventListener("click", a);
    h1.removeEventListener("click", a, {last: true});
    h1.dispatchEvent(new Event("click", {bubbles: true}));
  },
  expect: ""
}, {
  name: "Last: removeEventListener() {last: true} and then define new last event listener",
  fun: function (res) {
    function a(e) {
      res.push("a");
    }

    function b(e) {
      res.push("b");
    }


    const h1 = document.createElement("h1");
    h1.addEventListener("click", a, {last: true});
    h1.removeEventListener("click", a);
    h1.dispatchEvent(new MouseEvent("click"));
    res.push(".");
    h1.addEventListener("click", b, {last: true});
    h1.dispatchEvent(new MouseEvent("click"));
  },
  expect: ".b"
}, {
  name: "Last: removeEventListener() {last: true} when there is no event listener to remove",
  fun: function (res) {
    function a(e) {
      res.push("a");
    }


    const h1 = document.createElement("h1");
    h1.removeEventListener("click", a);
  },
  expect: ""
}];

export const last2 = [{
  name: "last: add {last: true} to THE SAME element twice",
  fun: function (res) {
    function a(e) {
      res.push("a");
    }

    function b(e) {
      res.push("b");
    }

    function c(e) {
      res.push("c");
    }

    let dom = cleanDom();
    dom.div.addEventListener("click", a);
    dom.div.addEventListener("click", a, {last: true});
    dom.div.addEventListener("click", b, {last: true});
    dom.div.addEventListener("click", c);
    dom.div.dispatchEvent(new Event("click",));
  },
  expect: "acb"
}, {
  name: "last: add {last: true} to DIFFERENT element twice",
  fun: function (res) {
    function a(e) {
      res.push("a");
    }

    function b(e) {
      res.push("b");
    }

    function c(e) {
      res.push("c");
    }

    let dom = cleanDom();
    dom.div.addEventListener("click", a, {last: true});
    dom.slot.addEventListener("click", b, {last: true});
    dom.slot.addEventListener("click", c);

    dom.div.dispatchEvent(new Event("click", {bubbles: true}));
    dom.slot.dispatchEvent(new Event("click", {bubbles: true}));
  },
  expect: "acba"
}, {
  name: "last: {capture:true, last: true}",
  fun: function (res) {
    function a(e) {
      res.push("a");
    }

    function b(e) {
      res.push("b");
    }

    function c(e) {
      res.push("c");
    }

    let dom = cleanDom();


    try {
      dom.div.addEventListener("click", a, {last: true});
      dom.div.addEventListener("click", b, {last: true});
      dom.div.addEventListener("click", c, {last: true});
    } catch (e) {
      res.push(" error ");
    }
    dom.div.dispatchEvent(new Event("click",));
  },
  expect: " error a"
}, {
  name: "last: does not propagate through shadowRoot",
  fun: function (res) {
    function a(e) {
      res.push("a");
    }

    function b(e) {
      res.push("b");
    }

    const dom = cleanDom(true);


    dom.shadowH1.addEventListener("click", a, {last: true});
    dom.div.addEventListener("click", b);

    dom.shadowH1.dispatchEvent(new Event("click", {bubbles: true}));
  },
  expect: "a"
}, {
  name: "last: {capture:true, bubbles: true, last: true}",
  fun: function (res) {
    function a(e) {
      res.push("a");
    }

    function b(e) {
      res.push("b");
    }

    const dom = cleanDom(true);


    dom.div.addEventListener("click", b, {last: true});
    dom.div.addEventListener("click", a);

    try {
      dom.div.addEventListener("click", a, {capture: true, bubbles: true, last: true});
    } catch (e) {
      res.push(" error ");
    }
    dom.div.dispatchEvent(new Event("click", {bubbles: true}));

  },
  expect: " error ab"
}, {
  name: "last: {capture:true, last: true}",
  fun: function (res) {
    function a(e) {
      res.push("a");
    }


    const dom = cleanDom(true);


    try {
      dom.div.addEventListener("click", a, {capture: true, last: true});
    } catch (e) {
      res.push(" error ");
    }
    dom.div.addEventListener("click", a);
    dom.div.dispatchEvent(new Event("click", {bubbles: true}));

  },
  expect: " error a"
}, {
  name: "last: {capture:false, last: true}",
  fun: function (res) {
    function a(e) {
      res.push("a");
    }

    function b(e) {
      res.push("b");
    }

    function c(e) {
      res.push("c");
    }

    const dom = cleanDom(true);


    dom.div.addEventListener("click", b, {capture: false, last: true});
    dom.div.addEventListener("click", a);
    dom.div.addEventListener("click", b);
    try {
      dom.div.addEventListener("click", c, {capture: false, last: true});
    } catch (e) {
      res.push("error ");
    }
    dom.div.dispatchEvent(new Event("click"));

  },
  expect: "error ab"
}, {
  name: "last: slotted element",
  fun: function (res) {
    function a(e) {
      res.push("a");
    }

    function b(e) {
      res.push("b");
    }

    const dom = cleanDom(true);


    dom.slot.addEventListener("click", a, {last: true});
    dom.slot.addEventListener("click", b);

    dom.slot.dispatchEvent(new Event("click", {bubbles: true}));
  },
  expect: "ba"
}, {
  name: "last: {last: true, once: true}",
  fun: function (res) {
    function a(e) {
      res.push("a");
    }

    function b(e) {
      res.push("b");
    }

    const dom = cleanDom(true);


    dom.slot.addEventListener("click", a, {last: true, once: true});
    dom.slot.addEventListener("click", b);

    dom.slot.dispatchEvent(new Event("click"));
    dom.slot.dispatchEvent(new Event("click"));
  },
  expect: "bab"
}];