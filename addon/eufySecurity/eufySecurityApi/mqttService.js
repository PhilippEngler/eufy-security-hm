"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MqttService = void 0;
const tiny_typed_emitter_1 = require("tiny-typed-emitter");
const service_1 = require("./mqtt/service");
const error_1 = require("./error");
class MqttService extends tiny_typed_emitter_1.TypedEmitter {
    api;
    config;
    logger;
    mqttService;
    /**
     * Create the MqttService object.
     * @param api The EufySecurityApi.
     * @param config The Config.
     * @param logger The Logger.
     */
    constructor(api, config, logger) {
        super();
        this.api = api;
        this.config = config;
        this.logger = logger;
        this.initialize();
    }
    /**
     * Initialize the MqttService.
     */
    async initialize() {
        this.mqttService = await service_1.MQTTService.init(this.logger);
        this.mqttService.on("connect", () => {
            this.logger.logInfoBasic("MQTT connection successfully established");
            this.emit("mqtt connect");
        });
        this.mqttService.on("close", () => {
            this.logger.logInfoBasic("MQTT connection closed");
            this.emit("mqtt close");
        });
        this.mqttService.on("lock message", (message) => {
            this.api.getDevice(message.data.data.deviceSn).then((device) => {
                device.processMQTTNotification(message.data.data, this.config.getEventDurationSeconds());
            }).catch((error) => {
                if (error instanceof error_1.DeviceNotFoundError) {
                }
                else {
                    this.logger.error("Lock MQTT Message Error", error);
                }
            }).finally(() => {
                this.emit("mqtt lock message", message);
            });
        });
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
}
exports.MqttService = MqttService;
