export const errorsTest = [{
  name: "First error: first on bubble phase",
  fun: function (res) {
    const h1 = document.createElement("h1");
    try {
      h1.addEventListener("click", e => res.push("a"), {first: true});
    } catch (e) {
      res.push("1");
    }
    try {
      h1.addEventListener("click", e => res.push("b"), {first: true, capture: false});
    } catch (e) {
      res.push("2");
    }
    h1.dispatchEvent(new MouseEvent("click"));
  },
  expect: "12"
}, {
  name: "Last error: capture phase listener ",
  fun: function (res) {
    const h1 = document.createElement("h1");
    try {
      h1.addEventListener("click", e => res.push("a"), {last: true, capture: true});
    } catch (e) {
      res.push("1");
    }
    h1.dispatchEvent(new MouseEvent("click"));
  },
  expect: "1",
}, {
  name: "first & last: {first: true, last: true}",
  fun: function (res) {
    const h1 = document.createElement("h1");
    try {
      h1.addEventListener("click", e => res.push("a"), {first: true, last: true});
    } catch (e) {
      res.push("error");
    }
    h1.dispatchEvent(new Event("click"));
  },
  expect: "error"
}, {
  name: "Last error: adding two last listeners",
  fun: function (res) {
    const h1 = document.createElement("h1");
    h1.addEventListener("click", e => res.push("a"), {last: true});
    try {
      h1.addEventListener("click", e => res.push("b"), {last: true});
    } catch (e) {
      res.push("1");
    }
    h1.dispatchEvent(new MouseEvent("click"));
  },
  expect: "1a",
}, {
  name: "First error: adding two first listeners",
  fun: function (res) {
    const h1 = document.createElement("h1");
    h1.addEventListener("click", e => res.push("a"), {first: true, capture: true});
    try {
      h1.addEventListener("click", e => res.push("b"), {first: true, capture: true});
    } catch (e) {
      res.push("error ");
    }
    h1.dispatchEvent(new MouseEvent("click"));
  },
  expect: "error a"
}];