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