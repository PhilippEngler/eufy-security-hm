import { TypedEmitter } from "tiny-typed-emitter";

import { EufySecurityApi } from './eufySecurityApi';
import { Config } from './config';
import { HTTPApi } from './http';
import { EufySecurityEvents } from './interfaces';
import { PushNotificationService } from "./push/service";
import { CheckinResponse, Credentials, FidInstallationResponse, GcmRegisterResponse, PushMessage } from "./push/models";
import { Logger } from './utils/logging';
import { ServerPushEvent } from "./push/types";
import { ensureError } from ".";

export class PushService extends TypedEmitter<EufySecurityEvents>
{
    private api : EufySecurityApi;
    private config : Config;
    private logger : Logger;
    private httpService !: HTTPApi;
    private pushService !: PushNotificationService;
    private pushCloudRegistered = false;
    private pushCloudChecked = false;
    private credential !: Credentials;
    private persistentIds !: string[];

    /**
     * Create the PushService object.
     * @param api The EufySecurityApi.
     * @param httpService The HTTPApi.
     * @param config The Config.
     * @param logger The Logger.
     */
    constructor(api : EufySecurityApi, httpService : HTTPApi, config : Config, logger : Logger)
    {
        super();
        this.api = api;
        this.httpService = httpService;
        this.config = config;
        this.logger = logger;
        
        this.initialize();
    }

    /**
     * Initialize the PushSerivce.
     */
    private async initialize() : Promise<void>
    {
        this.pushService = new PushNotificationService(this.logger);

        if(this.config.hasPushCredentials())
        {
            this.credential = this.getPushCredentials();
            this.pushService.setCredentials(this.credential);
        }
        if(this.config.getCredentialsPersistentIds())
        {
            this.persistentIds = this.pushService.getPersistentIds();
            this.pushService.setPersistentIds(this.persistentIds);
        }

        this.pushService.on("connect", async (token: string) => {
            this.pushCloudRegistered = await this.httpService.registerPushToken(token);
            this.pushCloudChecked = await this.httpService.checkPushToken();
            //TODO: Retry if failed with max retry to not lock account

            if (this.pushCloudRegistered && this.pushCloudChecked)
            {
                this.logger.logInfoBasic("Push notification connection successfully established.");
                this.emit("push connect");
            }
            else
            {
                this.logger.logInfoBasic("Push notification connection closed.");
                this.emit("push close");
            }
        });

        this.pushService.on("credential", (credentials: Credentials) => {
            this.savePushCredentials(credentials);
        });
        this.pushService.on("message", (message: PushMessage) => this.onPushMessage(message));
        this.pushService.on("close", () => {
            this.logger.logInfoBasic("Push notification connection closed.");
            this.emit("push close");
        });
    }

    /**
     * Connect the PushService.
     * @param credentials The Credentials.
     * @param persistentIds The persistentIds.
     */
    public async connect(credentials? : Credentials, persistentIds? : string[]) : Promise<void>
    {
        if (credentials)
        {
            this.pushService.setCredentials(credentials);
        }
        if (persistentIds)
        {
            this.pushService.setPersistentIds(persistentIds);
        }

        this.pushService.open();
    }

    /**
     * Close the PushService.
     */
    public close() : void
    {
        this.savePushPersistentIds();

        this.pushService.close();
    }

    /**
     * Save the Credentials to config.
     * @param credentials The Credentials.
     */
    private savePushCredentials(credentials : Credentials | undefined) : void
    {
        if(credentials !== undefined)
        {
            this.config.setCredentialsFidResponse(credentials.fidResponse);
            this.config.setCredentialsCheckinResponse(credentials.checkinResponse);
            this.config.setCredentialsGcmResponse(credentials.gcmResponse);
        }
    }

    /**
     * Returns the credentials stored in config.
     * @returns The Credentials.
     */
    private getPushCredentials() : Credentials
    {
        return {fidResponse: this.config.getCredentialsFidResponse() as FidInstallationResponse, checkinResponse: this.config.getCredentialsCheckinResponse() as CheckinResponse, gcmResponse: this.config.getCredentialsGcmResponse() as GcmRegisterResponse};;
    }

    /**
     * Save the persistentIds to config.
     */
    private savePushPersistentIds() : void
    {
        this.config.setCredentialsPersistentIds(this.getPushPersistentIds());
    }

    /**
     * Return the persistentIds stored in config.
     * @returns The persistentIds.
     */
    public getPushPersistentIds() : string[]
    {
        return this.pushService.getPersistentIds();
    }

    /**
     * Process a incoming PushMessage.
     * @param message The PushMessage to process.
     */
    private async onPushMessage(message : PushMessage) : Promise<void>
    {
        this.emit("push message", message);

        try
        {
            this.logger.debug("Received push message", message);
            try
            {
                if ((message.type === ServerPushEvent.INVITE_DEVICE || message.type === ServerPushEvent.HOUSE_INVITE) && this.config.getAcceptInvitations())
                {
                    this.api.processInvitations();
                }
            }
            catch(err)
            {
                const error = ensureError(err);
                this.logger.error(`Error processing server push notification for device invitation`, error);
            }
            try
            {
                if (message.type === ServerPushEvent.REMOVE_DEVICE || message.type === ServerPushEvent.REMOVE_HOMEBASE || message.type === ServerPushEvent.HOUSE_REMOVE)
                {
                    this.api.refreshCloudData();
                }
            }
            catch(err)
            {
                const error = ensureError(err);
                this.logger.error(`Error processing server push notification for device/station/house removal`, error);
            }

            try
            {
                var rawStations = await this.api.getRawStations();
                var stations = await rawStations.getStations();
                for(var stationSerial in stations)
                {
                    try
                    {
                        stations[stationSerial].processPushNotification(message);
                    }
                    catch(err)
                    {
                        const error = ensureError(err);
                        this.logger.error(`Error processing push notification for station ${stationSerial}`, error);
                    }
                }
            }
            catch(err)
            {
                const error = ensureError(err);
                this.api.logError("Process push notification for stations", error);
            }

            try
            {
                var rawDevices = await this.api.getRawDevices();
                var devices = await rawDevices.getDevices();
                for(var deviceSerial in devices)
                {
                    try
                    {
                        devices[deviceSerial].processPushNotification(message, this.config.getEventDurationSeconds());
                    }
                    catch(err)
                    {
                        const error = ensureError(err);
                        this.logger.error(`Error processing push notification for device ${deviceSerial}`, error);
                    }
                }
            }
            catch(err)
            {
                const error = ensureError(err);
                this.api.logError("Process push notification for devices", error);
            }
        }
        catch(error)
        {
            this.logger.error("Generic Error:", error);
        }
    }
}