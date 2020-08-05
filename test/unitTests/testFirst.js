import {cleanDom} from "./useCase1.js";

export const firstTest = [{
  name: "first is true: {first: true, capture: true}",
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

    const h1 = document.createElement("h1");
    h1.addEventListener("click", a);
    h1.addEventListener("click", b, {first: true, capture: true});
    h1.dispatchEvent(new MouseEvent("click"))
  },
  expect: "ba"
}, {
  name: "first is true: {first: 1}",
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

    const h1 = document.createElement("h1");
    h1.addEventListener("click", b, {capture: true});
    h1.addEventListener("click", a, {first: 1, capture: true});
    h1.dispatchEvent(new MouseEvent("click"))
  },
  expect: "ab"
}, {
  name: "first is true: {first: []}",
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

    const h1 = document.createElement("h1");
    h1.addEventListener("click", a, {capture: true});
    h1.addEventListener("click", b, {first: [], capture: true});
    h1.dispatchEvent(new MouseEvent("click"))
  },
  expect: "ba"
}, {
  name: "first is false: {first: false}",
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

    const h1 = document.createElement("h1");
    h1.addEventListener("click", a);
    h1.addEventListener("click", b, {first: false});
    h1.dispatchEvent(new MouseEvent("click"));
  },
  expect: "ab"
}, {
  name: "first is false: {first: 0}",
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

    const h1 = document.createElement("h1");
    h1.addEventListener("click", a);
    h1.addEventListener("click", b, {first: 0});
    h1.dispatchEvent(new MouseEvent("click"));
  },
  expect: "ab"
}, {
  name: "first is false: {first: ''}",
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

    const h1 = document.createElement("h1");
    h1.addEventListener("click", a);
    h1.addEventListener("click", b, {first: ''});
    h1.dispatchEvent(new MouseEvent("click"));
  },
  expect: "ab"
  //todo move this into a test of both last_first
// }, {
//   name: "first on bubble and capture side {capture: true, first: true}",
//   fun: function () {
//     res = "";
//     const h1 = document.createElement("h1");
//     const span = document.createElement("span");
//     h1.appendChild(span);
//
//     h1.addEventListener("click", function (e) {
//       res += "a";
//     }, {capture: true});
//     h1.addEventListener("click", function (e) {
//       res += "b";
//     }, {capture: true, first: true});
//     h1.addEventListener("click", function (e) {
//       res += "c";
//     });
//     h1.addEventListener("click", function (e) {
//       res += "d";
//     }, {last: true});
//     span.dispatchEvent(new MouseEvent("click", {bubbles: true}));
//   },
//   expect: function () {
//     return res === "badc";
//   }
}, {
  name: "First: removeEventListener() {first: true, capture: true} and then define new first event listener",
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

    const h1 = document.createElement("h1");

    h1.addEventListener("click", a, {first: true, capture: true});
    h1.removeEventListener("click", a, {capture: true});
    h1.addEventListener("click", b, {first: true, capture: true});
    h1.dispatchEvent(new MouseEvent("click"))

  }

  ,
  expect: "b"
}, {
  name: "First: removeEventListener() {first: true, capture: true} when there is no event listener to remove",
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

    const h1 = document.createElement("h1");
    h1.removeEventListener("click", a, {first: true, capture: true});
  }

  ,
  expect: ""
}];

export const firstErrorsTest = [{
  name: "First error: adding two first listeners",
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

    const h1 = document.createElement("h1");

    h1.addEventListener("click", a, {first: true, capture: true});
    try {
      h1.addEventListener("click", b, {first: true, capture: true});
    } catch (e) {
      res.push("error ");
    }
    h1.dispatchEvent(new MouseEvent("click"))
  },
  expect: "error a"
}, {
  name: "First error: first on bubble phase",
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

    const h1 = document.createElement("h1");

    try {
      h1.addEventListener("click", a, {first: true});
    } catch (e) {
      res.push("1");
    }
    try {
      h1.addEventListener("click", b, {first: true, capture: false});
    } catch (e) {
      res.push("2");
    }
    h1.dispatchEvent(new MouseEvent("click"))
  },
  expect: "12"
}];

export const first2 = [{
  name: "first: 1",
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
    dom.div.addEventListener("click", b);
    dom.div.addEventListener("click", a, {first: 1, capture: true});
    dom.div.dispatchEvent(new Event("click"));
  },
  expect: "ab"
}, {
  name: "first: removeEventListener",
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
    dom.div.addEventListener("click", a, {first: true, capture: true});
    dom.div.removeEventListener("click", a, {capture: true});
    dom.div.addEventListener("click", a, {capture: true});
    dom.div.removeEventListener("click", a, {last: true, capture: true});
    dom.div.dispatchEvent(new Event("click"));
  },
  expect: ""
}, {
  name: "first: add {first: true, capture: true} to THE SAME element twice",
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
    dom.div.addEventListener("click", b, {first: true, capture: true});
    try {
      dom.div.addEventListener("click", c, {first: true, capture: true});
      dom.div.addEventListener("click", c);
    } catch (e) {
      res.push("error ");
    }
    dom.div.dispatchEvent(new Event("click",));

  },
  expect: "error ba"
}, {
  name: "first: add {first: true, capture: true} to DIFFERENT element twice",
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
    dom.div.addEventListener("click", b, true);
    dom.div.addEventListener("click", a, {first: true, capture: true});
    dom.slot.addEventListener("click", b, true);
    dom.slot.addEventListener("click", a, {first: true, capture: true});

    dom.div.dispatchEvent(new Event("click", {bubbles: true}));
    dom.slot.dispatchEvent(new Event("click", {bubbles: true}));
  },
  expect: "ababab"
}, {
  name: "first: {capture:true, first: true}",
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
    dom.div.addEventListener("click", a, {first: true, capture: true});
    try {
      dom.div.addEventListener("click", b, {first: true, capture: true});
      dom.div.addEventListener("click", c, {first: true, capture: true});
    } catch (e) {
      res.push("error ");
    }
    dom.div.dispatchEvent(new Event("click",));
  },
  expect: "error a"
}, {
  name: "first: does not propagate through shadowRoot",
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
    dom.div.addEventListener("click", b);
    dom.shadowH1.addEventListener("click", a, {first: true, capture: true});

    dom.shadowH1.dispatchEvent(new Event("click"));
  },
  expect: "a"
}, {
  name: "first: {capture:true, bubbles: false, first: true}",
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
    dom.div.addEventListener("click", a);
    dom.div.addEventListener("click", b, {first: true, capture: true});

    try {
      dom.div.addEventListener("click", a, {capture: true, bubbles: false, first: true});
    } catch (e) {
      res.push(" error ");
    }
    dom.div.dispatchEvent(new Event("click"));
  },
  expect: " error ba"
}, {
  name: "first: {capture:true, first: true}",
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
    try {
      dom.div.addEventListener("click", a, {capture: true, first: true});
    } catch (e) {
      res.push(" error ");
    }
    dom.div.addEventListener("click", a);
    dom.div.dispatchEvent(new Event("click",));
  },
  expect: " error a"
}, {
  name: "first: {capture:true, first: true}",
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
    dom.div.addEventListener("click", a);
    dom.div.addEventListener("click", b, {capture: true, first: true});
    try {
      dom.div.addEventListener("click", c, {capture: true, first: true});
    } catch (e) {
      res.push(" error ");
    }
    dom.div.dispatchEvent(new Event("click"));

  },
  expect: " error ba"
}, {
  name: "first: slotted element",
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
    dom.slot.addEventListener("click", b, true);
    dom.slot.addEventListener("click", a, {first: true, capture: true});

    dom.slot.dispatchEvent(new Event("click",));
  },
  expect: "ab"
}, {
  name: "first: {first: true, once: true, capture: true}",
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
    dom.slot.addEventListener("click", b, true);
    dom.slot.addEventListener("click", a, {first: true, once: true, capture: true});

    dom.slot.dispatchEvent(new Event("click"));
    dom.slot.dispatchEvent(new Event("click"));
  },
  expect: "abb"
}, {
  name: "first: {first: true, once: true, capture: true}",
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
    dom.slot.addEventListener("click", a, {first: true, once: true, capture: true});
    dom.slot.addEventListener("click", b);

    dom.slot.dispatchEvent(new Event("click"));
    dom.slot.dispatchEvent(new Event("click"));
  },
  expect: "abb"
}, {
  name: "first: {first: true, last: true, capture: true}",
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
    try {
      dom.slot.addEventListener("click", a, {first: true, last: true, capture: true});
    } catch (e) {
      res.push("error ");
    }
    dom.slot.addEventListener("click", b);

    dom.slot.dispatchEvent(new Event("click"));
  },
  expect: "error b"
}];