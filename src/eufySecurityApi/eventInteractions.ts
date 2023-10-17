import { Config } from "./config";
import { Devices } from "./devices";
import { EufySecurityApi } from "./eufySecurityApi";
import { DeviceInteractions, EventInteraction, Interactions } from "./utils/models";
import { EventInteractionType } from "./utils/types";

export class EventInteractions
{
    private api: EufySecurityApi;
    private config: Config;
    private interactions: Interactions | null;

    /**
     * Create the EventInteractions object.
     */
    constructor(api: EufySecurityApi)
    {
        this.api = api;
        this.config = this.api.getConfig();
        var temp = this.config.getInteractions();
        if(temp === "")
        {
            this.interactions = null;
        }
        else
        {
            this.interactions = JSON.parse(temp);
        }
    }

    /**
     * Retrieve all interactions from config.
     */
    public getInteractions()
    {
        var temp = this.config.getInteractions();
        this.interactions = JSON.parse(`${temp !== undefined || temp !== "" ? temp : "{}"}`);
    }

    /**
     * Save all interactions to config.
     * @returns true if successfully, otherwise false.
     */
    private saveInteractions(): boolean
    {
        try
        {
            this.config.setInteractions(JSON.stringify(this.interactions));
            return true;
        }
        catch (error: any)
        {
            this.api.logError(`Error while adding integration to config. Error: ${error.message}`);
            throw new Error(`Error while adding integration to config. Error: ${error.message}`)
        }
    }

    /**
     * Retrieves all ineractions for a given device.
     * @param deviceSerial The serial of the device.
     * @returns A DeviceInteraction object or null.
     */
    public getDeviceInteractions(deviceSerial: string): DeviceInteractions | null
    {
        if(this.interactions !== null)
        {
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
    public getDeviceEventInteraction(deviceSerial: string, eventInteractionType: EventInteractionType): EventInteraction | null
    {
        if(this.interactions !== null)
        {
            try
            {
                var eventInteraction = JSON.parse(JSON.stringify(this.interactions.deviceInteractions[deviceSerial].eventInteractions[eventInteractionType]));
                if(eventInteraction !== null)
                {
                    eventInteraction.command = Buffer.from(eventInteraction.command, 'base64').toString();
                }
                return eventInteraction;
            }
            catch (error: any)
            {
                this.api.logError(`Error while retrieving EventInteraction ${eventInteractionType} for device ${deviceSerial}.`);
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
    public deleteDeviceEventInteraction(deviceSerial: string, eventInteractionType: EventInteractionType): boolean
    {
        try
        {
            if(this.interactions !== null)
            {
                if(this.interactions.deviceInteractions[deviceSerial].eventInteractions.hasOwnProperty(eventInteractionType))
                {
                    delete this.interactions.deviceInteractions[deviceSerial].eventInteractions[eventInteractionType];
                    if(Object.keys(this.interactions.deviceInteractions[deviceSerial].eventInteractions).length == 0)
                    {
                        delete this.interactions.deviceInteractions[deviceSerial];
                        if(Object.keys(this.interactions.deviceInteractions).length == 0)
                        {
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
        catch(error: any)
        {
            this.api.logError(`Error occured while deleting interaction ${eventInteractionType} for device ${deviceSerial}. Error: ${error.message}`);
            throw new Error(`Error occured while deleting interaction ${eventInteractionType} for device ${deviceSerial}. Error: ${error.message}`)
        }
    }

    /**
     * Set a specified interaction for a given device.
     * @param deviceSerial The serial of the device.
     * @param eventInteractionType The type of event.
     * @param deviceEventInteraction The EventInteraction object.
     * @returns true if successfully, otherwise false.
     */
    public setDeviceInteraction(deviceSerial: string, eventInteractionType: EventInteractionType, deviceEventInteraction: EventInteraction): boolean
    {
        try
        {
            if(this.interactions === undefined || this.interactions === null)
            {
                this.interactions = {deviceInteractions: {[deviceSerial]: {eventInteractions: {[eventInteractionType]: {target: deviceEventInteraction.target, useHttps: deviceEventInteraction.useHttps, command: Buffer.from(deviceEventInteraction.command).toString('base64')}}}}};
            }
            else
            {
                if(this.interactions.deviceInteractions[deviceSerial] === undefined)
                {
                    this.interactions.deviceInteractions[deviceSerial] = {eventInteractions: {[eventInteractionType]: {target: deviceEventInteraction.target, useHttps: deviceEventInteraction.useHttps, command: Buffer.from(deviceEventInteraction.command).toString('base64')}}};
                }
                else
                {
                    if(this.interactions.deviceInteractions[deviceSerial].eventInteractions === undefined)
                    {
                        this.interactions.deviceInteractions[deviceSerial].eventInteractions = {[eventInteractionType]: {target: deviceEventInteraction.target, useHttps: deviceEventInteraction.useHttps, command: Buffer.from(deviceEventInteraction.command).toString('base64')}};
                    }
                    else
                    {
                        deviceEventInteraction.command = Buffer.from(deviceEventInteraction.command).toString('base64');
                        this.interactions.deviceInteractions[deviceSerial].eventInteractions[eventInteractionType] = deviceEventInteraction;
                    }
                }
            }
            
            var res = this.saveInteractions();
            
            if(res === true)
            {
                return true;
            }
            else
            {
                return false;
            }
        }
        catch(error: any)
        {
            this.api.logError(`Error occured while adding new interaction ${eventInteractionType} for device ${deviceSerial}. Error: ${error.message}`);
            throw new Error(`Error occured while adding new interaction ${eventInteractionType} for device ${deviceSerial}. Error: ${error.message}`)
        }
    }
}