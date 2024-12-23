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