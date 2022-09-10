import { TypedEmitter } from "tiny-typed-emitter";

import { EufySecurityApi } from './eufySecurityApi';
import { Config } from './config';
import { HTTPApi } from './http';
import { EufySecurityEvents } from './interfaces';
import { PushNotificationService } from "./push/service";
import { CheckinResponse, Credentials, FidInstallationResponse, GcmRegisterResponse, PushMessage } from "./push/models";
import { Logger } from './utils/logging';
import { ServerPushEvent } from "./push/types";

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
    
    constructor(api : EufySecurityApi, httpService : HTTPApi, config : Config, logger : Logger)
    {
        super();
        this.api = api;
        this.httpService = httpService;
        this.config = config;
        this.logger = logger;
        
        this.initialize();
    }

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

    public async registerPushNotifications(credentials? : Credentials, persistentIds? : string[]) : Promise<void>
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

    public closePushService() : void
    {
        this.savePushPersistentIds();

        this.pushService.close();
    }

    private savePushCredentials(credentials: Credentials | undefined): void
    {
        if(credentials != undefined)
        {
            this.config.setCredentialsFidResponse(credentials.fidResponse);
            this.config.setCredentialsCheckinResponse(credentials.checkinResponse);
            this.config.setCredentialsGcmResponse(credentials.gcmResponse);
        }
    }

    private getPushCredentials() : Credentials
    {
        return {fidResponse: this.config.getCredentialsFidResponse() as FidInstallationResponse, checkinResponse: this.config.getCredentialsCheckinResponse() as CheckinResponse, gcmResponse: this.config.getCredentialsGcmResponse() as GcmRegisterResponse};;
    }

    private savePushPersistentIds() : void
    {
        this.config.setCredentialsPersistentIds(this.getPushPersistentIds());
    }

    public getPushPersistentIds() : string[]
    {
        return this.pushService.getPersistentIds();
    }

    private async onPushMessage(message: PushMessage): Promise<void>
    {
        this.emit("push message", message);

        try
        {
            this.logger.debug("Received push message", message);
            /*try
            {
                if ((message.type === ServerPushEvent.INVITE_DEVICE || message.type === ServerPushEvent.HOUSE_INVITE) && this.config.acceptInvitations)
                {
                    this.processInvitations();
                }
            }
            catch (error)
            {
                this.logger.error(`Error processing server push notification for device invitation`, error);
            }*/
            try
            {
                if (message.type === ServerPushEvent.REMOVE_DEVICE || message.type === ServerPushEvent.REMOVE_HOMEBASE || message.type === ServerPushEvent.HOUSE_REMOVE)
                {
                    this.api.refreshCloudData();
                }
            }
            catch (error)
            {
                this.logger.error(`Error processing server push notification for device/station/house removal`, error);
            }

            var rawStations = await this.api.getRawStations();
            var stations = rawStations.getStations();
            for(var stationSerial in stations)
            {
                try
                {
                    stations[stationSerial].processPushNotification(message);
                }
                catch (error)
                {
                    this.logger.error(`Error processing push notification for station ${stationSerial}`, error);
                }
            }
            var rawDevices = await this.api.getRawDevices();
            var devices = rawDevices.getDevices();
            for(var deviceSerial in devices)
            {
                try
                {
                    devices[deviceSerial].processPushNotification(message, this.config.getEventDurationSeconds());
                }
                catch (error)
                {
                    this.logger.error(`Error processing push notification for device ${deviceSerial}`, error);
                }
            }
        }
        catch (error)
        {
            this.logger.error("Generic Error:", error);
        }
    }
}