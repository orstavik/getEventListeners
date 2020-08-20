export const dynamicTest = [{
  name: "dynamic 1: add listener to the currentTarget for same event",
  fun: function(res) {
    const h1 = document.createElement("h1");
    h1.addEventListener("click", function () {
      res.push("a");
      h1.addEventListener("click", e => res.push("b"));
    });
    h1.dispatchEvent(new MouseEvent("click"));
    h1.dispatchEvent(new MouseEvent("click"));
  },
  expect: "aab",
}, {
  name: "dynamic 2: add listener to the currentTarget for different event types, and dispatch nested events",
  fun: function(res) {
    const h1 = document.createElement("h1");

    h1.addEventListener("click", function () {
      res.push("a");
      h1.addEventListener("keypress", function (e) {
        res.push("b");
        h1.addEventListener("keyup", function (e) {
          res.push("c");
        });
        h1.dispatchEvent(new KeyboardEvent("keyup"));
      });
      h1.dispatchEvent(new KeyboardEvent("keypress"));
    });
    h1.dispatchEvent(new MouseEvent("click"));
  },
  expect: "abc",
}, {
  name: "dynamic 3: Remove listener from listener",
  fun: function(res) {
    const h1 = document.createElement("h1");

    function a() {
      res.push("a");
    }

    function b() {
      res.push("b");
    }

    h1.addEventListener("click", () => h1.removeEventListener("click", b));
    h1.addEventListener("click", a);
    h1.addEventListener("click", b);
    h1.dispatchEvent(new MouseEvent("click"))
  },
  expect: "a",
}, {
  name: "dynamic 4: add event listeners",
  fun: function(res) {
    const h1 = document.createElement("h1");

    function a(e) {
      res.push("a");
    }

    h1.addEventListener("click", function () {
      res.push("x");
      h1.addEventListener("click", a);
    });

    h1.dispatchEvent(new MouseEvent("click"));
    h1.dispatchEvent(new MouseEvent("click"));
  },
  expect: "xxa",
}, {
  name: "dynamic 5: add and remove event listeners",
  fun: function(res) {
    const h1 = document.createElement("h1");

    function a(e) {
      res.push("a");
    }

    let x;
    h1.addEventListener("click", x = function () {
      res.push("x");
      h1.removeEventListener("click", x);
      h1.addEventListener("click", a);
    });

    h1.dispatchEvent(new MouseEvent("click"));
    h1.dispatchEvent(new MouseEvent("click"));
  },
  expect: "xa",
}];