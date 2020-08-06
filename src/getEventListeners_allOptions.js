import {addEventTargetRegistry, removeEventTargetRegistry} from "./getEventListeners_once_last_first.js";
import {
  addEventListenerOptionScopedUnstoppable,
  removeEventListenerOptionScopedUnstoppable
} from "./EventListenersOptionUnstoppableScoped.js";
import {addEventIsStoppedScoped, removeEventIsStoppedScoped} from "./ScopedStopPropagation.js";

let isScopedSettings;

export function addGetEventListeners_allOptions(scopedByDefault) {
  const isStopped = addEventIsStoppedScoped();
  addEventListenerOptionScopedUnstoppable(isStopped);
  isScopedSettings = Object.getOwnPropertyDescriptor(Event.prototype, "isScoped");
  scopedByDefault && Object.defineProperty(Event.prototype, "isScoped", {value: true});
  return {isStopped, getEventListeners: addEventTargetRegistry()};
}

export function removeGetEventListeners_allOptions() {
  removeEventTargetRegistry();
  removeEventListenerOptionScopedUnstoppable()
  removeEventIsStoppedScoped();
  isScopedSettings ? Object.defineProperty(Event.prototype, "isScoped", isScopedSettings) : (Event.prototype.isScoped = undefined);
}