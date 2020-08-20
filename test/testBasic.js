export const testBasic = [{
  name: "target only (addEventListener with different options, not connected to the DOM, called twice)",
  fun: function (res) {
    const h1 = document.createElement("h1");
    h1.addEventListener("click", function (e) {
      res.push("a");
    });
    h1.addEventListener("click", function (e) {
      res.push("b");
    }, {});
    h1.addEventListener("click", function (e) {
      res.push("c");
    }, true);
    h1.addEventListener("click", function (e) {
      res.push("d");
    }, false);
    h1.addEventListener("click", function (e) {
      res.push("e");
    }, {capture: true});
    h1.addEventListener("click", function (e) {
      res.push("f");
    }, {capture: false});
    h1.addEventListener("click", function (e) {
      res.push("g");
    }, {capture: "omg"});
    h1.dispatchEvent(new Event("click", {bubbles: true}));
    h1.dispatchEvent(new Event("click", {bubbles: true}));
  },
  expect: "abcdefgabcdefg"
}, {
  name: "removeEventListener",
  fun: function(res){
    //res = "";
    const h1 = document.createElement("h1");

    function cb(e) {
      res.push("omg");
    }

    h1.addEventListener("click", cb, {});
    h1.removeEventListener("click", cb, {});
    h1.dispatchEvent(new Event("click", {bubbles: true}));
  },
  expect: ""
}, {
  name: "removeEventListener and add it again",
  fun: function(res){
    //res = "";
    const h1 = document.createElement("h1");

    function cb(e) {
      res.push("c");
    }

    h1.addEventListener("click", cb);
    h1.removeEventListener("click", cb);
    h1.addEventListener("click", cb);
    h1.dispatchEvent(new Event("click", {bubbles: true}));
  },
  expect: "c"
}, {
  name: "simple capture, at_target, bubble",
  fun: function(res){
    const h1 = document.createElement("h1");
    const h2 = document.createElement("h2");
    h1.appendChild(h2);

    function cb(e) {
      res.push(e.eventPhase);
    }

    h1.addEventListener("click", cb);
    h1.addEventListener("click", cb, true);
    h2.addEventListener("click", cb);
    h2.addEventListener("click", cb, true);
    h2.dispatchEvent(new Event("click", {bubbles: true}));
  },
  expect: "1223"
}, {
  name: "basic: at_target order differ host/end target",
  fun: function(res){
    const webComp = document.createElement("shadow-comp");

    function cbCapture(e) {
      res.push(e.eventPhase + "-");
    }
    function cbBubble(e) {
      res.push(e.eventPhase + "+");
    }

    webComp.addEventListener("click", cbBubble);
    webComp.addEventListener("click", cbCapture, true);
    webComp.shadowRoot.addEventListener("click", cbBubble);
    webComp.shadowRoot.addEventListener("click", cbCapture, true);
    webComp.shadowRoot.children[0].addEventListener("click", cbBubble);
    webComp.shadowRoot.children[0].addEventListener("click", cbCapture, true);
    webComp.shadowRoot.children[0].dispatchEvent(new Event("click", {bubbles: true, composed: true}));
  },
  expect: "2-1-2+2-3+2+"
}];