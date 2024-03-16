"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventInteractions = void 0;
const logging_1 = require("./logging");
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
        const temp = this.config.getInteractions();
        if (temp === null || temp === "") {
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
        const temp = this.config.getInteractions();
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
            logging_1.rootAddonLogger.error(`Error while adding integration to config. Error: ${error.message}`);
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
                const eventInteraction = JSON.parse(JSON.stringify(this.interactions.deviceInteractions[deviceSerial].eventInteractions[eventInteractionType]));
                if (eventInteraction !== null) {
                    eventInteraction.command = Buffer.from(eventInteraction.command, "base64").toString();
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
                throw new Error(`No interaction for eventInteractionType ${eventInteractionType} at device ${deviceSerial}.`);
            }
            throw new Error(`No interactions for device ${deviceSerial}.`);
        }
        catch (error) {
            logging_1.rootAddonLogger.error(`Error occured while deleting interaction ${eventInteractionType} for device ${deviceSerial}. Error: ${error.message}`);
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
            if (this.interactions === undefined || this.interactions === null) {
                this.interactions = { deviceInteractions: { [deviceSerial]: { eventInteractions: { [eventInteractionType]: { target: deviceEventInteraction.target, useHttps: deviceEventInteraction.useHttps, command: Buffer.from(deviceEventInteraction.command).toString("base64") } } } } };
            }
            else {
                if (this.interactions.deviceInteractions[deviceSerial] === undefined) {
                    this.interactions.deviceInteractions[deviceSerial] = { eventInteractions: { [eventInteractionType]: { target: deviceEventInteraction.target, useHttps: deviceEventInteraction.useHttps, command: Buffer.from(deviceEventInteraction.command).toString("base64") } } };
                }
                else {
                    if (this.interactions.deviceInteractions[deviceSerial].eventInteractions === undefined) {
                        this.interactions.deviceInteractions[deviceSerial].eventInteractions = { [eventInteractionType]: { target: deviceEventInteraction.target, useHttps: deviceEventInteraction.useHttps, command: Buffer.from(deviceEventInteraction.command).toString("base64") } };
                    }
                    else {
                        deviceEventInteraction.command = Buffer.from(deviceEventInteraction.command).toString("base64");
                        this.interactions.deviceInteractions[deviceSerial].eventInteractions[eventInteractionType] = deviceEventInteraction;
                    }
                }
            }
            const res = this.saveInteractions();
            if (res === true) {
                return true;
            }
            else {
                return false;
            }
        }
        catch (error) {
            logging_1.rootAddonLogger.error(`Error occured while adding new interaction ${eventInteractionType} for device ${deviceSerial}. Error: ${error.message}`);
            throw new Error(`Error occured while adding new interaction ${eventInteractionType} for device ${deviceSerial}. Error: ${error.message}`);
        }
    }
    /**
     * Remove all integrations.
     * @returns true, if all integrations deleted, otherwise false.
     */
    removeIntegrations() {
        let json = {};
        if (this.interactions === null) {
            json = `{"success":false,"interactionsRemoved":true,"description":"No interactions in the config."}`;
        }
        else {
            this.interactions = null;
            const res = this.saveInteractions();
            if (res === true) {
                json = `{"success":true,"interactionsRemoved":true}`;
            }
            else {
                json = `{"success":false,"interactionsRemoved":false}`;
            }
        }
        return json;
    }
}
exports.EventInteractions = EventInteractions;
