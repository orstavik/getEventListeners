import {addEventTargetRegistry, removeEventTargetRegistry} from "./getEventListeners_once_last_first.js";
import {
  addEventListenerOptionScopedUnstoppable,
  removeEventListenerOptionScopedUnstoppable
} from "./EventListenersOptionUnstoppableScoped.js";

export function addGetEventListeners_allOptions() {
  const isStopped = addEventListenerOptionScopedUnstoppable();
  const getEventListeners = addEventTargetRegistry(); //must be added last of the two, as they both upgrade the EventTarget prototype.
  //todo configurable: true is added to be able to remove the isScoped value afterwards.
  //todo this is done for testing purposes, to fit into the testing framework, but it should not remain in the production ready code.
  return {isStopped, getEventListeners};
}

export function removeGetEventListeners_allOptions() {
  removeEventTargetRegistry();
  removeEventListenerOptionScopedUnstoppable();
}