import { TypedEmitter } from "tiny-typed-emitter";

import { EufySecurityApi } from './eufySecurityApi';
import { Config } from './config';
import { Device, Lock } from './http';
import { EufySecurityEvents } from './interfaces';
import { MQTTService } from "./mqtt/service";
import { rootMQTTLogger } from './logging';
import { DeviceNotFoundError } from "./error";
import { getError } from "./utils";

export class MqttService extends TypedEmitter<EufySecurityEvents>
{
    private api : EufySecurityApi;
    private config : Config;
    private mqttService!: MQTTService;

    /**
     * Create the MqttService object.
     * @param api The EufySecurityApi.
     * @param config The Config.
     * @param logger The Logger.
     */
    constructor(api : EufySecurityApi, config : Config)
    {
        super();
        this.api = api;
        this.config = config;
        
        this.initialize();
    }

    /**
     * Initialize the MqttService.
     */
    private async initialize() : Promise<void>
    {
        this.mqttService = await MQTTService.init();
        this.mqttService.on("connect", () => {
            rootMQTTLogger.info("MQTT connection successfully established");
            this.emit("mqtt connect");
        });
        this.mqttService.on("close", () => {
            rootMQTTLogger.info("MQTT connection closed");
            this.emit("mqtt close");
        });
        this.mqttService.on("lock message", (message) => {
            this.api.getDevice(message.data.data.deviceSn).then((device: Device) => {
                (device as Lock).processMQTTNotification(message.data.data, this.config.getEventDurationSeconds());
            }).catch((error) => {
                if (!(error instanceof DeviceNotFoundError)) {
                    rootMQTTLogger.error("Lock MQTT Message Error", { error: getError(error) });
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
    public connect(clientId : string, androidId : string, apiBase : string, email : string) : void
    {
        this.mqttService.connect(clientId, androidId, apiBase, email);
    }

    /**
     * Close the MqtService.
     */
    public close() : void
    {
        this.mqttService.close();
    }

    /**
     * Returns a boolean value to indicate the connection state.
     * @returns True if connected to eufy, otherwise false.
     */
    public isConnected() : boolean
    {
        return this.mqttService.isConnected();
    }

    /**
     * Add a device given by the device serial to the MqttService.
     * @param deviceSerial The device serial of the lock to add.
     */
    public subscribeLock(deviceSerial : string) : void
    {
        this.mqttService.subscribeLock(deviceSerial);
    }
}