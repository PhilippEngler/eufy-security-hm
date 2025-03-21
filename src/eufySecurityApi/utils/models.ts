/**
 * The interface for interactions.
 */
export interface Interactions {
    deviceInteractions: {[deviceSerial: string]: DeviceInteractions};
}

/**
 * The interface for device interactions.
 */
export interface DeviceInteractions {
    eventInteractions: {[eventInteractionType: number]: EventInteraction};
}

/**
 * The interface for event interaction.
 */
export interface EventInteraction {
    target: string;
    useHttps: boolean;
    useLocalCertificate: boolean;
    rejectUnauthorized: boolean;
    user?: string;
    password?: string;
    command: string;
}

/**
 * The interface for EufyCountry
 */
export interface EufyCountry {
    countryName: string;
    countryPhoneCode: string;
    countryCode: string;
}

/**
 * The interface for CameraEvent
 */
export interface CameraEvent {
    path: string;
    start_time: Date;
}

/**
 * The types for the value types of system variables in HomeMatic
 */
export type HomeMaticSystemvariableValueType = "ivtBinary" | "ivtFloat" | "ivtInteger" | "ivtString";

/**
 * The types for the value sub types of system variables in HomeMatic
 */
export type HomeMaticSystemvariableValueSubType = "istPresent" | "istAlarm" | "istGeneric" | "istBool" | "istEnum" | "istChar8859";

/**
 * The interface for common system variables in HomeMatic
 */
export interface HomeMaticSystemvariable {
    name: string;
    info: string;
    valueType: HomeMaticSystemvariableValueType;
    valueSubType: HomeMaticSystemvariableValueSubType;
}

/**
 * The interface for string system variables in HomeMatic.
 */
export interface HomeMaticSystemvariableString extends HomeMaticSystemvariable {
    valueType: "ivtString";
    valueSubType: "istChar8859";
    valueUnit: "";
    state: "";
}

/**
 * The interface for float system variables in HomeMatic.
 */
export interface HomeMaticSystemvariableFloat extends HomeMaticSystemvariable {
    valueType: "ivtFloat";
    valueSubType: "istGeneric";
    valueUnit: string;
    valueMin: number;
    valueMax: number,
    state: number;
}

/**
 * The interface for binary system variables in HomeMatic.
 */
export interface HomeMaticSystemvariableBinary extends HomeMaticSystemvariable {
    valueType: "ivtBinary";
    valueSubType: "istBool";
    valueUnit: "";
    valueName0: string;
    valueName1: string;
    state: boolean;
}

/**
 * The interface for integer system variables in HomeMatic.
 */
export interface HomeMaticSystemvariableInteger extends HomeMaticSystemvariable {
    valueType: "ivtInteger";
    valueSubType: "istEnum";
    valueList: string;
    state: number;
}