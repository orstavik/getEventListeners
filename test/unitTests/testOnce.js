import {cleanDom} from "./useCase1.js";

// let res;

function a(e) {
  res.push("a");
}

function b(e) {
  res.push("b");
}

function c(e) {
  res.push("c");
}

function getResult() {
  return res;
}

export const testOnce = [{
  name: "once: true",
  fun: function(res) {
    //res = "";
    function a(e) {
      res.push("a");
    }

    const h1 = document.createElement("h1");
    h1.addEventListener("click", a, {once: true});
    h1.dispatchEvent(new Event("click"));
    h1.dispatchEvent(new Event("click"));
    h1.dispatchEvent(new Event("click", {bubbles: true, composed: true}));
  },
  expect: "a",
  result: getResult
}, {
  name: "once: false",
  fun: function(res) {
    //res = "";
    function a(e) {
      res.push("a");
    }

    const h1 = document.createElement("h1");
    h1.addEventListener("click", a, {once: false});
    h1.dispatchEvent(new Event("click"));
    h1.dispatchEvent(new Event("click"));
    h1.dispatchEvent(new Event("click", {bubbles: true, composed: true}));
  },
  expect: "aaa",
  result: getResult
}, {
  name: "once: adding same listener object to the same target",
  fun: function(res) {
    //res = "";
    function a(e) {
      res.push("a");
    }

    function b(e) {
      res.push("b");
    }

    const h1 = document.createElement("h1");
    h1.addEventListener("click", a, {capture: true, once: true});
    h1.addEventListener("click", a, true);
    h1.addEventListener("click", a, {once: true});
    h1.addEventListener("click", a, {once: 1});
    h1.addEventListener("click", a);

    h1.addEventListener("click", b, {once: true});
    h1.addEventListener("click", b);

    h1.dispatchEvent(new Event("click", {bubbles: true}));
    h1.dispatchEvent(new Event("click"));
  },
  expect: "aab",
  result: getResult
}, {
  name: "once: removeEventListener twice",
  fun: function(res) {
    //res = "";
    function a(e) {
      res.push("a");
    }

    const h1 = document.createElement("h1");
    h1.addEventListener("click", a, {once: true});
    h1.removeEventListener("click", a);
    h1.addEventListener("click", a);
    h1.removeEventListener("click", a, {once: true});
    h1.dispatchEvent(new Event("click", {bubbles: true}));
  },
  expect: "",
  result: getResult
}, {
  name: "once: two multiple listeners to the same target, not once added first",
  fun: function(res) {
    //res = "";
    function a(e) {
      res.push("a");
    }

    function b(e) {
      res.push("b");
    }

    const h1 = document.createElement("h1");
    h1.addEventListener("click", a);
    h1.addEventListener("click", a, {once: true});
    h1.addEventListener("click", b);
    h1.addEventListener("click", b, {once: true});
    h1.dispatchEvent(new Event("click", {bubbles: true}));
    h1.dispatchEvent(new Event("click", {bubbles: true}));
    h1.dispatchEvent(new Event("click", {bubbles: true}));
  },
  expect: "ababab",
  result: getResult
}, {
  name: "once: {capture:true, once: true}",
  fun: function(res) {
    //res = "";
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
    h1.addEventListener("click", b, {once: true});
    h1.addEventListener("click", c, {capture: true, once: true});

    h1.dispatchEvent(new Event("click", {bubbles: true}));
    h1.dispatchEvent(new Event("click", {bubbles: true}));
    h1.dispatchEvent(new Event("click", {bubbles: true}));
  },
  expect: "abcaa",  //c is after ab, because the h1 is in the lowestmost AT_TARGET phase
  result: getResult
}, {
  name: "once: slotted element",          //todo move these last two tests to the test of propagation
  fun: function(res) {
    //res = "";
    function a(e) {
      res.push("a");
    }

    function b(e) {
      res.push("b");
    }

    const dom = cleanDom(true);
    dom.slot.addEventListener("click", a, {once: true});
    dom.slot.addEventListener("click", b);
    dom.slot.dispatchEvent(new Event("click", {bubbles: true}));
    dom.shadowComp.dispatchEvent(new Event("click", {bubbles: true}));
    dom.shadowComp.dispatchEvent(new Event("click", {bubbles: true}));
  },
  expect: "abbb",
  result: getResult
}, {
  name: "once: composed: false does not propagates through shadowRoot",
  fun: function(res) {
    //res = "";
    const dom = cleanDom(true);
    function a(e) {
      res.push("a");
    }

    function b(e) {
      res.push("b");
    }

    dom.shadowH1.addEventListener("click", a, {once: true});
    dom.div.addEventListener("click", b);
    dom.shadowH1.dispatchEvent(new Event("click", {bubbles: true}));
    dom.shadowH1.dispatchEvent(new Event("click", {bubbles: true}));
  },
  expect: "a",
  result: getResult
}];