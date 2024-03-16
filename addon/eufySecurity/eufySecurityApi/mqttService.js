"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MqttService = void 0;
const tiny_typed_emitter_1 = require("tiny-typed-emitter");
const service_1 = require("./mqtt/service");
const logging_1 = require("./logging");
const error_1 = require("./error");
const utils_1 = require("./utils");
class MqttService extends tiny_typed_emitter_1.TypedEmitter {
    api;
    config;
    mqttService;
    /**
     * Create the MqttService object.
     * @param api The EufySecurityApi.
     * @param config The Config.
     * @param logger The Logger.
     */
    constructor(api, config) {
        super();
        this.api = api;
        this.config = config;
        this.initialize();
    }
    /**
     * Initialize the MqttService.
     */
    async initialize() {
        this.mqttService = await service_1.MQTTService.init();
        this.mqttService.on("connect", () => this.onConnect());
        this.mqttService.on("close", () => this.onClose());
        this.mqttService.on("lock message", (message) => this.onLockMessage(message));
    }
    /**
     * Connect to the MQTT Servers.
     * @param clientId The clientID.
     * @param androidId The androidID.
     * @param apiBase The apiBase.
     * @param email The email.
     */
    connect(clientId, androidId, apiBase, email) {
        this.mqttService.connect(clientId, androidId, apiBase, email);
    }
    /**
     * Close the MqtService.
     */
    close() {
        this.mqttService.close();
    }
    /**
     * Returns a boolean value to indicate the connection state.
     * @returns True if connected to eufy, otherwise false.
     */
    isConnected() {
        return this.mqttService.isConnected();
    }
    /**
     * Add a device given by the device serial to the MqttService.
     * @param deviceSerial The device serial of the lock to add.
     */
    subscribeLock(deviceSerial) {
        this.mqttService.subscribeLock(deviceSerial);
    }
    /**
     * Eventhandler for mqtt connect event.
     */
    onConnect() {
        logging_1.rootMQTTLogger.info("MQTT connection successfully established");
        this.emit("mqtt connect");
    }
    /**
     * Eventhandler for mqtt close event.
     */
    onClose() {
        logging_1.rootMQTTLogger.info("MQTT connection closed");
        this.emit("mqtt close");
    }
    /**
     * Eventhandler for mqtt lock message.
     * @param message The message.
     */
    onLockMessage(message) {
        this.api.getDevice(message.data.data.deviceSn).then((device) => {
            device.processMQTTNotification(message.data.data, this.config.getEventDurationSeconds());
        }).catch((error) => {
            if (!(error instanceof error_1.DeviceNotFoundError)) {
                logging_1.rootMQTTLogger.error("Lock MQTT Message Error", { error: (0, utils_1.getError)(error) });
            }
        }).finally(() => {
            this.emit("mqtt lock message", message);
        });
    }
}
exports.MqttService = MqttService;
