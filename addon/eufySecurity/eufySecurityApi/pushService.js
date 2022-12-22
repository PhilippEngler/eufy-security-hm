"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushService = void 0;
const tiny_typed_emitter_1 = require("tiny-typed-emitter");
const service_1 = require("./push/service");
const types_1 = require("./push/types");
class PushService extends tiny_typed_emitter_1.TypedEmitter {
    /**
     * Create the PushService object.
     * @param api The EufySecurityApi.
     * @param httpService The HTTPApi.
     * @param config The Config.
     * @param logger The Logger.
     */
    constructor(api, httpService, config, logger) {
        super();
        this.pushCloudRegistered = false;
        this.pushCloudChecked = false;
        this.api = api;
        this.httpService = httpService;
        this.config = config;
        this.logger = logger;
        this.initialize();
    }
    /**
     * Initialize the PushSerivce.
     */
    async initialize() {
        this.pushService = new service_1.PushNotificationService(this.logger);
        if (this.config.hasPushCredentials()) {
            this.credential = this.getPushCredentials();
            this.pushService.setCredentials(this.credential);
        }
        if (this.config.getCredentialsPersistentIds()) {
            this.persistentIds = this.pushService.getPersistentIds();
            this.pushService.setPersistentIds(this.persistentIds);
        }
        this.pushService.on("connect", async (token) => {
            this.pushCloudRegistered = await this.httpService.registerPushToken(token);
            this.pushCloudChecked = await this.httpService.checkPushToken();
            //TODO: Retry if failed with max retry to not lock account
            if (this.pushCloudRegistered && this.pushCloudChecked) {
                this.logger.logInfoBasic("Push notification connection successfully established.");
                this.emit("push connect");
            }
            else {
                this.logger.logInfoBasic("Push notification connection closed.");
                this.emit("push close");
            }
        });
        this.pushService.on("credential", (credentials) => {
            this.savePushCredentials(credentials);
        });
        this.pushService.on("message", (message) => this.onPushMessage(message));
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
    async connect(credentials, persistentIds) {
        if (credentials) {
            this.pushService.setCredentials(credentials);
        }
        if (persistentIds) {
            this.pushService.setPersistentIds(persistentIds);
        }
        this.pushService.open();
    }
    /**
     * Close the PushService.
     */
    close() {
        this.savePushPersistentIds();
        this.pushService.close();
    }
    /**
     * Save the Credentials to config.
     * @param credentials The Credentials.
     */
    savePushCredentials(credentials) {
        if (credentials != undefined) {
            this.config.setCredentialsFidResponse(credentials.fidResponse);
            this.config.setCredentialsCheckinResponse(credentials.checkinResponse);
            this.config.setCredentialsGcmResponse(credentials.gcmResponse);
        }
    }
    /**
     * Returns the credentials stored in config.
     * @returns The Credentials.
     */
    getPushCredentials() {
        return { fidResponse: this.config.getCredentialsFidResponse(), checkinResponse: this.config.getCredentialsCheckinResponse(), gcmResponse: this.config.getCredentialsGcmResponse() };
        ;
    }
    /**
     * Save the persistentIds to config.
     */
    savePushPersistentIds() {
        this.config.setCredentialsPersistentIds(this.getPushPersistentIds());
    }
    /**
     * Return the persistentIds stored in config.
     * @returns The persistentIds.
     */
    getPushPersistentIds() {
        return this.pushService.getPersistentIds();
    }
    /**
     * Process a incoming PushMessage.
     * @param message The PushMessage to process.
     */
    async onPushMessage(message) {
        this.emit("push message", message);
        try {
            this.logger.debug("Received push message", message);
            try {
                if ((message.type === types_1.ServerPushEvent.INVITE_DEVICE || message.type === types_1.ServerPushEvent.HOUSE_INVITE) && this.config.getAcceptInvitations()) {
                    this.api.processInvitations();
                }
            }
            catch (error) {
                this.logger.error(`Error processing server push notification for device invitation`, error);
            }
            try {
                if (message.type === types_1.ServerPushEvent.REMOVE_DEVICE || message.type === types_1.ServerPushEvent.REMOVE_HOMEBASE || message.type === types_1.ServerPushEvent.HOUSE_REMOVE) {
                    this.api.refreshCloudData();
                }
            }
            catch (error) {
                this.logger.error(`Error processing server push notification for device/station/house removal`, error);
            }
            try {
                var rawStations = await this.api.getRawStations();
                var stations = await rawStations.getStations();
                for (var stationSerial in stations) {
                    try {
                        stations[stationSerial].processPushNotification(message);
                    }
                    catch (error) {
                        this.logger.error(`Error processing push notification for station ${stationSerial}`, error);
                    }
                }
            }
            catch (error) {
                this.api.logError("Process push notification for stations", error);
            }
            try {
                var rawDevices = await this.api.getRawDevices();
                var devices = rawDevices.getDevices();
                for (var deviceSerial in devices) {
                    try {
                        devices[deviceSerial].processPushNotification(message, this.config.getEventDurationSeconds());
                    }
                    catch (error) {
                        this.logger.error(`Error processing push notification for device ${deviceSerial}`, error);
                    }
                }
            }
            catch (error) {
                this.api.logError("Process push notification for devices", error);
            }
        }
        catch (error) {
            this.logger.error("Generic Error:", error);
        }
    }
}
exports.PushService = PushService;
