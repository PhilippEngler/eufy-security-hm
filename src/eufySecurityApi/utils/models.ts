import { OpenCcuSystemvariableValueSubType, OpenCcuSystemvariableValueType } from "./types";

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
 * The interface for the generic system variables in OpenCCU
 */
export interface OpenCcuSystemvariableGeneric {
    name: string;
    info: string;
    valueType: OpenCcuSystemvariableValueType;
    valueSubType: OpenCcuSystemvariableValueSubType;
    valueUnit: string;
    valueMin: number | undefined;
    valueMax: number | undefined,
    valueName0: string | undefined;
    valueName1: string | undefined;
    valueList: string | undefined;
    state: string | number | boolean;
}

/**
 * The interface for common system variables in OpenCCU
 */
export interface OpenCcuSystemvariable {
    name: string;
    info: string;
    valueType: OpenCcuSystemvariableValueType;
    valueSubType: OpenCcuSystemvariableValueSubType;
}

/**
 * The interface for string system variables in OpenCCU
 */
export interface OpenCcuSystemvariableString extends OpenCcuSystemvariable {
    valueType: "ivtString";
    valueSubType: "istChar8859";
    valueUnit: "";
    state: "";
}

/**
 * The interface for float system variables in OpenCCU
 */
export interface OpenCcuSystemvariableFloat extends OpenCcuSystemvariable {
    valueType: "ivtFloat";
    valueSubType: "istGeneric";
    valueUnit: string;
    valueMin: number;
    valueMax: number,
    state: number;
}

/**
 * The interface for binary system variables in OpenCCU
 */
export interface OpenCcuSystemvariableBinary extends OpenCcuSystemvariable {
    valueType: "ivtBinary";
    valueSubType: "istBool";
    valueUnit: "";
    valueName0: string;
    valueName1: string;
    state: boolean;
}

/**
 * The interface for integer system variables in OpenCCU.
 */
export interface OpenCcuSystemvariableInteger extends OpenCcuSystemvariable {
    valueType: "ivtInteger";
    valueSubType: "istEnum";
    valueList: string;
    state: number;
}