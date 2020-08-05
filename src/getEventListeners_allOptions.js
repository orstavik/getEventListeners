import {addEventTargetRegistry} from "./getEventListeners_once_last_first.js";
import {addEventListenerOptionScopedUnstoppable} from "./EventListenersOptionUnstoppableScoped.js";
import {addEventIsStoppedScoped} from "./ScopedStopPropagation.js";

export function addGetEventListeners_allOptions(
  scopedByDefault,
  eventPrototype = Event.prototype,
  eventTargetPrototype = EventTarget.prototype
) {
  const isStopped = addEventIsStoppedScoped(eventPrototype);
  addEventListenerOptionScopedUnstoppable(eventTargetPrototype, isStopped);
  scopedByDefault && Object.defineProperty(eventPrototype, "isScoped", {value: true});
  return {getEventListeners: addEventTargetRegistry(eventTargetPrototype), isStopped};
}

