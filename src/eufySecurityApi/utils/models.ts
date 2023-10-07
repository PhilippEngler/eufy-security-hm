export interface Interactions {
    deviceInteractions: {[deviceSerial: string]: DeviceInteractions};
}

export interface DeviceInteractions {
    eventInteractions: {[eventInteractionType: number]: EventInteraction};
}

export interface EventInteraction {
    target: string;
    useHttps: boolean;
    user?: string;
    password?: string;
    command: string;
}