# getEventListeners (polyfill)

Polyfill for the getEventListeners method available in dev tools. 

Includes a) extended event listener options such as 'first', 'last' and 'unstoppable' and b) a patch that will scope calls to 'stopPropagation()' to only apply to other event listeners under the same propagation root (ie. under the same ShadowRoot/window). These additions are separated in different modules.

hello sunshine on a [rainy](docs/rainy.md) day