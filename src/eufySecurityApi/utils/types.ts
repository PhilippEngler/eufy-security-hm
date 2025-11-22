/**
 * The enum for event interaction type.
 */
export enum EventInteractionType {
    MOTION = 0,
    RADAR_MOTION = 1,
    PERSON = 2,
    PET = 3,
    SOUND = 4,
    CRYING = 5,
    IDENTITY_PERSON = 6,
    STRANGER_PERSON = 7,
    VEHICLE = 8,
    DOG = 9,
    DOG_LICK = 10,
    DOG_POOP = 11,
    RING = 12,
    OPEN = 13,
    CLOSE = 14
}

/**
 * The type for refresh data target.
 */
export type RefreshDataTarget = "all" | "devices" | "houses" | "stations";

/**
 * The types for the value types of system variables in OpenCCU
 */
export type OpenCcuSystemvariableValueType = "ivtBinary" | "ivtFloat" | "ivtInteger" | "ivtString";

/**
 * The types for the value sub types of system variables in OpenCCU.
 */
export type OpenCcuSystemvariableValueSubType = "istPresent" | "istAlarm" | "istGeneric" | "istBool" | "istEnum" | "istChar8859";

/**
 * The types for the api service state.
 */
export type apiServiceState = "init" | "configNeeded" | "ok" | "disconnected" | "shutdown";