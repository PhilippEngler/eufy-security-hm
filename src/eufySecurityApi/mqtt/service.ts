import * as mqtt from "mqtt"
import { TypedEmitter } from "tiny-typed-emitter";
import { readFileSync } from 'fs';
import path from "path";
import { load, Root } from "protobuf-typescript";

import { MQTTServiceEvents } from "./interface";
import { DeviceSmartLockMessage } from "./model";

import { Logger } from "../utils/logging";

export class MQTTService extends TypedEmitter<MQTTServiceEvents> {

    private readonly CLIENT_ID_FORMAT = "android_EufySecurity_<user_id>_<android_id>";
    private readonly USERNAME_FORMAT = "eufy_<user_id>";
    private readonly SUBSCRIBE_NOTICE_FORMAT = "/phone/<user_id>/notice";
    private readonly SUBSCRIBE_LOCK_FORMAT = "/phone/smart_lock/<device_sn>/push_message";
    private readonly SUBSCRIBE_DOORBELL_FORMAT = "/phone/doorbell/<device_sn>/push_message";

    private static proto: Root | null = null;

    private log: Logger;
    private connected = false;
    private client: mqtt.MqttClient | null = null;
    private connecting = false;

    private clientID?: string;
    private androidID?: string;
    private apiBase?: string;
    private email?: string;

    private subscribeLocks: Array<string> = [];

    private deviceSmartLockMessageModel: any;

    private constructor(log: Logger) {
        super();
        this.log = log;

        this.deviceSmartLockMessageModel = MQTTService.proto!.lookupType("DeviceSmartLockMessage");
    }

    public static async init(log: Logger): Promise<MQTTService> {
        this.proto = await load(path.join(__dirname, "./proto/lock.proto"));
        return new MQTTService(log);
    }

    private parseSmartLockMessage(data: Buffer): DeviceSmartLockMessage {
        const message = this.deviceSmartLockMessageModel.decode(data);
        const object = this.deviceSmartLockMessageModel.toObject(message, {
            longs: String,
            enums: String,
            bytes: String,
        });
        return object as DeviceSmartLockMessage;
    }

    private getMQTTBrokerUrl(apiBase: string): string {
        switch(apiBase) {
            case "https://security-app.eufylife.com":
                return "mqtts://security-mqtt.eufylife.com";
            case "https://security-app-ci.eufylife.com":
                return "mqtts://security-mqtt-ci.eufylife.com";
            case "https://security-app-qa.eufylife.com":
            case "https://security-app-cn-qa.anker-in.com":
                return "mqtts://security-mqtt-qa.eufylife.com";
            case "https://security-app-eu.eufylife.com":
                return "mqtts://security-mqtt-eu.eufylife.com";
            case "https://security-app-short-qa.eufylife.com":
                return "mqtts://security-mqtt-short-qa.eufylife.com";
            default:
                return "mqtts://security-mqtt.eufylife.com";
        }
    }

    public connect(clientID: string, androidID: string, apiBase: string, email: string): void {
        this.clientID = clientID;
        this.androidID = androidID;
        this.apiBase = apiBase;
        this.email = email;
        if (!this.connected && !this.connecting && this.clientID && this.androidID && this.apiBase && this.email && this.subscribeLocks.length > 0) {
            this.connecting = true;
            this.client = mqtt.connect(this.getMQTTBrokerUrl(apiBase), {
                keepalive: 60,
                clean: true,
                reschedulePings: true,
                resubscribe: true,
                port: 8789,
                username: this.USERNAME_FORMAT.replace("<user_id>", clientID),
                password: email,
                ca: readFileSync(path.join(__dirname, "./mqtt-eufy.crt")),
                clientId: this.CLIENT_ID_FORMAT.replace("<user_id>", clientID).replace("<android_id>", androidID)
            });
            this.client.on("connect", (_connack) => {
                this.connected = true;
                this.connecting = false;
                this.emit("connect");
                this.client!.subscribe(this.SUBSCRIBE_NOTICE_FORMAT.replace("<user_id>", clientID), { qos: 1 });

                if (this.subscribeLocks.length > 0) {
                    let lock;
                    while ((lock = this.subscribeLocks.shift()) !== undefined) {
                        this._subscribeLock(lock);
                    }
                }
            });
            this.client.on("close", () => {
                this.connected = false;
                this.emit("close");
            });
            this.client.on("error", (error) => {
                this.connecting = false;
                this.log.error("MQTT Error", error);
                if ((error as any).code === 1 || (error as any).code === 2 || (error as any).code === 4 || (error as any).code === 5)
                    this.client?.end();
            });
            this.client.on("message", (topic, message, _packet) => {
                if (topic.includes("smart_lock")) {
                    const parsedMessage = this.parseSmartLockMessage(message);
                    this.log.debug("Received a smart lock message over MQTT", parsedMessage);
                    this.emit("lock message", parsedMessage);
                } else {
                    this.log.debug("MQTT message received", topic, message.toString("hex"));
                }
            });
        }
    }

    private _subscribeLock(deviceSN: string): void {
        this.client?.subscribe(this.SUBSCRIBE_LOCK_FORMAT.replace("<device_sn>", deviceSN), { qos: 1 }, (error, granted) => {
            if (error) {
                this.log.error(`Subscribe error for lock ${deviceSN}`, error);
            }
            if (granted) {
                this.log.info(`Successfully registered to MQTT notifications for lock ${deviceSN}`);
            }
        });
    }

    public subscribeLock(deviceSN: string): void {
        if (this.connected) {
            this._subscribeLock(deviceSN);
        } else {
            if (!this.subscribeLocks.includes(deviceSN)) {
                this.subscribeLocks.push(deviceSN);
            }
            if (this.clientID && this.androidID && this.apiBase && this.email)
                this.connect(this.clientID, this.androidID, this.apiBase, this.email);
        }
    }

    public isConnected(): boolean {
        return this.connected;
    }

    public close(): void {
        if (this.connected) {
            this.client?.end(true);
            this.connected = false;
            this.connecting = false;
        }
    }

}