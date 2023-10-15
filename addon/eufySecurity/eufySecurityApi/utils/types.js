"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventInteractionType = void 0;
var EventInteractionType;
(function (EventInteractionType) {
    EventInteractionType[EventInteractionType["MOTION"] = 0] = "MOTION";
    EventInteractionType[EventInteractionType["RADAR_MOTION"] = 1] = "RADAR_MOTION";
    EventInteractionType[EventInteractionType["PERSON"] = 2] = "PERSON";
    EventInteractionType[EventInteractionType["PET"] = 3] = "PET";
    EventInteractionType[EventInteractionType["SOUND"] = 4] = "SOUND";
    EventInteractionType[EventInteractionType["CRYING"] = 5] = "CRYING";
    EventInteractionType[EventInteractionType["IDENTITY_PERSON"] = 6] = "IDENTITY_PERSON";
    EventInteractionType[EventInteractionType["STRANGER_PERSON"] = 7] = "STRANGER_PERSON";
    EventInteractionType[EventInteractionType["VEHICLE"] = 8] = "VEHICLE";
    EventInteractionType[EventInteractionType["DOG"] = 9] = "DOG";
    EventInteractionType[EventInteractionType["DOG_LICK"] = 10] = "DOG_LICK";
    EventInteractionType[EventInteractionType["DOG_POOP"] = 11] = "DOG_POOP";
    EventInteractionType[EventInteractionType["RING"] = 12] = "RING";
})(EventInteractionType || (exports.EventInteractionType = EventInteractionType = {}));
