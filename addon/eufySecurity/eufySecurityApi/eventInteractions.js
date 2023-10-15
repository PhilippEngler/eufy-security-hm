"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventInteractions = void 0;
class EventInteractions {
    api;
    config;
    interactions;
    /**
     * Create the EventInteractions object.
     */
    constructor(api) {
        this.api = api;
        this.config = this.api.getConfig();
        var temp = this.config.getInteractions();
        if (temp === "") {
            this.interactions = null;
        }
        else {
            this.interactions = JSON.parse(temp);
        }
    }
    /**
     * Retrieve all interactions from config.
     */
    getInteractions() {
        var temp = this.config.getInteractions();
        this.interactions = JSON.parse(`${temp !== undefined || temp !== "" ? temp : "{}"}`);
    }
    /**
     * Save all interactions to config.
     * @returns true if successfully, otherwise false.
     */
    saveInteractions() {
        try {
            this.config.setInteractions(JSON.stringify(this.interactions));
            return true;
        }
        catch (error) {
            throw new Error(`Error while adding integration to config. Error: ${error.message}`);
        }
    }
    /**
     * Retrieves all ineractions for a given device.
     * @param deviceSerial The serial of the device.
     * @returns A DeviceInteraction object or null.
     */
    getDeviceInteractions(deviceSerial) {
        if (this.interactions !== null) {
            return this.interactions.deviceInteractions[deviceSerial];
        }
        return null;
    }
    /**
     * Retrieves a specified interaction for a given device.
     * @param deviceSerial The serial of the device.
     * @param eventInteractionType The type of event.
     * @returns The eventIneraction object or null.
     */
    getDeviceEventInteraction(deviceSerial, eventInteractionType) {
        if (this.interactions !== null) {
            try {
                var eventInteraction = JSON.parse(JSON.stringify(this.interactions.deviceInteractions[deviceSerial].eventInteractions[eventInteractionType]));
                if (eventInteraction !== null) {
                    eventInteraction.command = Buffer.from(eventInteraction.command, 'base64').toString();
                }
                return eventInteraction;
            }
            catch (error) {
                throw new Error(`Error while retrieving EventInteraction ${eventInteractionType} for device ${deviceSerial}.`);
            }
        }
        return null;
    }
    /**
     * Delete a given event from a given device.
     * @param deviceSerial The serial of the device.
     * @param eventInteractionType The type of event.
     * @returns true if successfully, otherwise false.
     */
    deleteDeviceEventInteraction(deviceSerial, eventInteractionType) {
        try {
            if (this.interactions !== null) {
                if (this.interactions.deviceInteractions[deviceSerial].eventInteractions.hasOwnProperty(eventInteractionType)) {
                    delete this.interactions.deviceInteractions[deviceSerial].eventInteractions[eventInteractionType];
                    if (Object.keys(this.interactions.deviceInteractions[deviceSerial].eventInteractions).length == 0) {
                        delete this.interactions.deviceInteractions[deviceSerial];
                        if (Object.keys(this.interactions.deviceInteractions).length == 0) {
                            this.interactions = null;
                        }
                    }
                    this.saveInteractions();
                    return true;
                }
                throw new Error(`No interaction for eventInteractionType ${eventInteractionType}.`);
            }
            throw new Error(`No interactions for device ${deviceSerial}.`);
        }
        catch (error) {
            throw new Error(`Error occured while deleting interaction ${eventInteractionType} for device ${deviceSerial}. Error: ${error.message}`);
        }
    }
    /**
     * Set a specified interaction for a given device.
     * @param deviceSerial The serial of the device.
     * @param eventInteractionType The type of event.
     * @param deviceEventInteraction The EventInteraction object.
     * @returns true if successfully, otherwise false.
     */
    setDeviceInteraction(deviceSerial, eventInteractionType, deviceEventInteraction) {
        try {
            if (this.interactions !== null) {
                deviceEventInteraction.command = Buffer.from(deviceEventInteraction.command).toString('base64');
                this.interactions.deviceInteractions[deviceSerial].eventInteractions[eventInteractionType] = deviceEventInteraction;
            }
            else {
                this.interactions = { deviceInteractions: { [deviceSerial]: { eventInteractions: { [eventInteractionType]: { target: deviceEventInteraction.target, useHttps: deviceEventInteraction.useHttps, command: Buffer.from(deviceEventInteraction.command).toString('base64') } } } } };
            }
            var res = this.saveInteractions();
            if (res === true) {
                return true;
            }
            else {
                return false;
            }
        }
        catch (error) {
            throw new Error(`Error occured while adding new interaction ${eventInteractionType} for device ${deviceSerial}. Error: ${error.message}`);
        }
    }
}
exports.EventInteractions = EventInteractions;
