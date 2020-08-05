//todo this test is not good as it uses isStopped as a global method

let res1 = "";
export const testIsStopped = [{
  name: "isStopped: before dispatch",
  fun: function () {
    res1 = "";
    const h1 = document.createElement("h1");
    h1.addEventListener("click", function (e) {
      res1 += "omg";
    })
    const event = new Event("click");
    event.stopPropagation();
    res1 += isStopped(event) ? "1" : "wtf1";
    h1.dispatchEvent(event);
    const event2 = new Event("click");
    event2.stopImmediatePropagation();
    res1 += isStopped(event2) ? "2" : "wtf2";
    h1.dispatchEvent(event2);
    const event3 = new Event("click");
    event3.stopPropagation();
    res1 += isStopped(event3, true) ? "3" : "wtf3";
    h1.dispatchEvent(event3);
    const event4 = new Event("click");
    event4.stopImmediatePropagation();
    res1 += isStopped(event4, true) ? "4" : "wtf4";
    h1.dispatchEvent(event4);
  },
  expect: "1234",
  result: function () {
    return res1;
  }
// }, {
//   name: "isStopped: stopPropagation() and stopImmediatePropagation() before dispatch",
//   fun: function () {
//     res1 = res2 = res3 = "";
//     const dom = cleanDom();
//     dom.shadowComp
//     dom.shadowH1.dispatchEvent(new Event("click"));
//   },
//   expect: "shadowRoot shadowH1 shadowH1 +-+:122",
//   result: function () {
//     return res1 + res2 + ":" + res3;
//   }
}];