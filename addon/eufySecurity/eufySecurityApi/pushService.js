"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushService = void 0;
const tiny_typed_emitter_1 = require("tiny-typed-emitter");
const service_1 = require("./push/service");
const logging_1 = require("./logging");
const types_1 = require("./push/types");
const error_1 = require("./error");
const utils_1 = require("./utils");
class PushService extends tiny_typed_emitter_1.TypedEmitter {
    api;
    config;
    httpService;
    pushService;
    pushCloudRegistered = false;
    pushCloudChecked = false;
    credential;
    persistentIds;
    /**
     * Create the PushService object.
     * @param api The EufySecurityApi.
     * @param httpService The HTTPApi.
     * @param config The Config.
     * @param logger The Logger.
     */
    constructor(api, httpService, config) {
        super();
        this.api = api;
        this.httpService = httpService;
        this.config = config;
        this.initialize();
    }
    /**
     * Initialize the PushSerivce.
     */
    async initialize() {
        this.pushService = await service_1.PushNotificationService.initialize();
        if (this.config.hasPushCredentials()) {
            this.credential = this.getPushCredentials();
            this.pushService.setCredentials(this.credential);
        }
        if (this.config.getCredentialsPersistentIds()) {
            this.persistentIds = this.pushService.getPersistentIds();
            this.pushService.setPersistentIds(this.persistentIds);
        }
        this.pushService.on("connect", async (token) => await this.onConnect(token));
        this.pushService.on("credential", (credentials) => this.onSavePushCredentials(credentials));
        this.pushService.on("message", (message) => this.onPushMessage(message));
        this.pushService.on("close", () => this.onClose());
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
     * Eventhandler for push connect event.
     * @param token The push token.
     */
    async onConnect(token) {
        this.pushCloudRegistered = await this.httpService.registerPushToken(token);
        this.pushCloudChecked = await this.httpService.checkPushToken();
        //TODO: Retry if failed with max retry to not lock account
        if (this.pushCloudRegistered && this.pushCloudChecked) {
            logging_1.rootPushLogger.info("Push notification connection successfully established.");
            this.emit("push connect");
        }
        else {
            logging_1.rootPushLogger.info("Push notification connection closed.");
            this.emit("push close");
        }
    }
    /**
     * Eventhandler for push close event.
     */
    onClose() {
        logging_1.rootPushLogger.info("Push notification connection closed.");
        this.emit("push close");
    }
    /**
     * Eventhandler for save push credentials event.
     * @param credentials The Credentials.
     */
    onSavePushCredentials(credentials) {
        this.savePushCredentials(credentials);
    }
    /**
     * Save the Credentials to config.
     * @param credentials The Credentials.
     */
    savePushCredentials(credentials) {
        if (credentials !== undefined) {
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
            logging_1.rootPushLogger.debug("Received push message", { message: message });
            try {
                if ((message.type === types_1.ServerPushEvent.INVITE_DEVICE || message.type === types_1.ServerPushEvent.HOUSE_INVITE) && this.config.getAcceptInvitations()) {
                    this.api.processInvitations();
                }
            }
            catch (err) {
                const error = (0, error_1.ensureError)(err);
                logging_1.rootPushLogger.error(`Error processing server push notification for device invitation`, { error: (0, utils_1.getError)(error), message: message });
            }
            try {
                if (message.type === types_1.ServerPushEvent.REMOVE_DEVICE || message.type === types_1.ServerPushEvent.REMOVE_HOMEBASE || message.type === types_1.ServerPushEvent.HOUSE_REMOVE) {
                    this.api.refreshCloudData();
                }
            }
            catch (err) {
                const error = (0, error_1.ensureError)(err);
                logging_1.rootPushLogger.error(`Error processing server push notification for device/station/house removal`, { error: (0, utils_1.getError)(error), message: message });
            }
            try {
                const stations = await this.api.getStations();
                for (const stationSerial in stations) {
                    try {
                        stations[stationSerial].processPushNotification(message);
                    }
                    catch (err) {
                        const error = (0, error_1.ensureError)(err);
                        logging_1.rootPushLogger.error(`Error processing push notification for station`, { error: (0, utils_1.getError)(error), stationSN: stationSerial, message: message });
                    }
                }
            }
            catch (err) {
                const error = (0, error_1.ensureError)(err);
                logging_1.rootPushLogger.error("Process push notification for stations", { error: (0, utils_1.getError)(error), message: message });
            }
            try {
                const devices = await this.api.getDevices();
                for (const deviceSerial in devices) {
                    try {
                        const station = await this.api.getStation(devices[deviceSerial].getStationSerial());
                        if (station !== undefined) {
                            try {
                                devices[deviceSerial].processPushNotification(station, message, this.config.getEventDurationSeconds());
                            }
                            catch (err) {
                                const error = (0, error_1.ensureError)(err);
                                logging_1.rootPushLogger.error(`Error processing push notification for device`, { error: (0, utils_1.getError)(error), deviceSN: deviceSerial, message: message });
                            }
                        }
                    }
                    catch (err) {
                        const error = (0, error_1.ensureError)(err);
                        logging_1.rootPushLogger.error("Process push notification for devices loading station", { error: (0, utils_1.getError)(error), message: message });
                    }
                }
            }
            catch (err) {
                const error = (0, error_1.ensureError)(err);
                logging_1.rootPushLogger.error("Process push notification for devices", { error: (0, utils_1.getError)(error), message: message });
            }
        }
        catch (err) {
            const error = (0, error_1.ensureError)(err);
            logging_1.rootPushLogger.error("OnPushMessage Generic Error", { error: (0, utils_1.getError)(error), message: message });
        }
    }
}
exports.PushService = PushService;
