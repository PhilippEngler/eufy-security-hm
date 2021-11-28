"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bases = void 0;
const tiny_typed_emitter_1 = require("tiny-typed-emitter");
const http_1 = require("./http");
const utils_1 = require("./push/utils");
/**
 * Represents all the Bases in the account.
 */
class Bases extends tiny_typed_emitter_1.TypedEmitter {
    /**
     * Create the Bases objects holding all bases in the account.
     * @param api The eufySecurityApi.
     * @param httpService The httpService.
     */
    constructor(api, httpService) {
        super();
        this.bases = {};
        this.skipNextModeChangeEvent = {};
        this.api = api;
        this.httpService = httpService;
        this.serialNumbers = [];
    }
    /**
     * Set the devices connected with the account.
     * @param devices The devices to set.
     */
    setDevices(devices) {
        this.devices = devices;
    }
    /**
     * (Re)Loads all Bases and the settings of them.
     */
    loadBases() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.resBases = this.httpService.getHubs();
                if (this.resBases != null) {
                    for (var stationSerial in this.resBases) {
                        if (this.bases[stationSerial]) {
                            this.bases[stationSerial].update(this.resBases[stationSerial]);
                        }
                        else {
                            this.bases[stationSerial] = new http_1.Station(this.api, this.httpService, this.resBases[stationSerial]);
                            this.skipNextModeChangeEvent[stationSerial] = false;
                            this.serialNumbers.push(stationSerial);
                            yield this.bases[stationSerial].connect();
                            if (this.api.getApiUseUpdateStateEvent()) {
                                this.addEventListenerInstantly(this.bases[stationSerial], "GuardModeChanged");
                                this.addEventListenerInstantly(this.bases[stationSerial], "PropertyChanged");
                                this.addEventListenerInstantly(this.bases[stationSerial], "RawPropertyChanged");
                            }
                            this.addEventListenerInstantly(this.bases[stationSerial], "RawDevicePropertyChanged");
                            this.addEventListenerInstantly(this.bases[stationSerial], "ChargingState");
                            this.addEventListenerInstantly(this.bases[stationSerial], "WifiRssi");
                            this.addEventListenerInstantly(this.bases[stationSerial], "RuntimeState");
                        }
                    }
                    yield this.saveBasesSettings();
                }
                else {
                    this.bases = {};
                }
            }
            catch (e) {
                this.bases = {};
                throw new Error(e);
            }
        });
    }
    /**
     * Close all P2P connection for all bases.
     */
    closeP2PConnections() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.resBases != null) {
                for (var stationSerial in this.resBases) {
                    if (this.bases[stationSerial]) {
                        yield this.bases[stationSerial].close();
                        this.removeEventListener(this.bases[stationSerial], "GuardModeChanged");
                        this.removeEventListener(this.bases[stationSerial], "PropertyChanged");
                        this.removeEventListener(this.bases[stationSerial], "RawPropertyChanged");
                        this.removeEventListener(this.bases[stationSerial], "RawDevicePropertyChanged");
                        this.removeEventListener(this.bases[stationSerial], "ChargingState");
                        this.removeEventListener(this.bases[stationSerial], "WifiRssi");
                        this.removeEventListener(this.bases[stationSerial], "RuntimeState");
                    }
                }
            }
        });
    }
    /**
     * Update the infos of all connected devices over P2P.
     */
    updateDeviceData() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.httpService.updateDeviceInfo().catch(error => {
                this.api.logError("Error occured at updateDeviceData while API data refreshing.", error);
            });
            Object.values(this.bases).forEach((station) => __awaiter(this, void 0, void 0, function* () {
                if (station.isConnected() && station.getDeviceType() !== http_1.DeviceType.DOORBELL) {
                    yield station.getCameraInfo().catch(error => {
                        this.api.logError(`Error occured at updateDeviceData while station ${station.getSerial()} p2p data refreshing.`, error);
                    });
                }
            }));
        });
    }
    /**
     * Save the relevant settings (mainly for P2P-Connection) to the config
     */
    saveBasesSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.api.saveBasesSettings(this.bases, this.serialNumbers);
        });
    }
    /**
     * Returns a Array of all Bases.
     */
    getBases() {
        return this.bases;
    }
    /**
     * Get the guard mode for all bases.
     */
    getGuardMode() {
        return this.getBases();
    }
    /**
     * Set the guard mode of all bases to the given mode.
     * @param guardMode The target guard mode.
     */
    setGuardMode(guardMode) {
        return __awaiter(this, void 0, void 0, function* () {
            for (var stationSerial in this.bases) {
                this.skipNextModeChangeEvent[stationSerial] = true;
                yield this.bases[stationSerial].setGuardMode(guardMode);
                yield (0, utils_1.sleep)(500);
            }
            return yield this.checkChangedGuardMode(guardMode, true, "");
        });
    }
    /**
     * Set the guard mode for the given base to the given mode.
     * @param baseSerial The serial of the base the mode to change.
     * @param guardMode The target guard mode.
     */
    setGuardModeBase(baseSerial, guardMode) {
        return __awaiter(this, void 0, void 0, function* () {
            this.skipNextModeChangeEvent[baseSerial] = true;
            yield this.bases[baseSerial].setGuardMode(guardMode);
            return yield this.checkChangedGuardMode(guardMode, false, this.bases[baseSerial].getSerial());
        });
    }
    /**
     * Check the guardMode after changing if the guardMode has changed.
     * @param guardMode The guradMode the base should be set to.
     * @param checkAllBases true, if all bases should be checked, otherwise false
     * @param baseSerial The serial of the base the mode to change.
     */
    checkChangedGuardMode(guardMode, checkAllBases, baseSerial) {
        return __awaiter(this, void 0, void 0, function* () {
            var res = false;
            if (checkAllBases == true) {
                var cnt = 0;
                for (var stationSerial in this.bases) {
                    for (var i = 0; i < 20; i++) {
                        yield (0, utils_1.sleep)(1000);
                        yield this.loadBases();
                        if (this.bases[stationSerial].getGuardMode().value == guardMode) {
                            this.api.logInfo(`Detected changed alarm mode for station ${stationSerial} after ${(i + 1)} iterations.`);
                            res = true;
                            break;
                        }
                    }
                    if (res == false) {
                        this.api.logInfo(`Changed alarm mode for station ${stationSerial} could not be detected after 20 iterations.`);
                        cnt = cnt + 1;
                    }
                }
                if (cnt == 0) {
                    res = true;
                }
                else {
                    res = false;
                }
            }
            else {
                for (var i = 0; i < 20; i++) {
                    yield (0, utils_1.sleep)(1000);
                    yield this.loadBases();
                    if (this.bases[baseSerial].getGuardMode().value == guardMode) {
                        this.api.logInfo(`Detected changed alarm mode for station ${baseSerial} after ${(i + 1)} iterations.`);
                        res = true;
                        break;
                    }
                }
                if (res == false) {
                    this.api.logInfo(`Changed alarm mode for station ${baseSerial} could not be detected after 20 iterations.`);
                }
            }
            if (res == true) {
                return true;
            }
            else {
                return false;
            }
        });
    }
    /**
     * Add instantly a given event listener for a given base.
     * @param base The base as Station object.
     * @param eventListenerName The event listener name as string.
     */
    addEventListenerInstantly(base, eventListenerName) {
        switch (eventListenerName) {
            case "GuardModeChanged":
                base.on("guard mode", (station, guardMode) => this.onStationGuardModeChanged(station, guardMode));
                this.api.logDebug(`Listener 'GuardModeChanged' for base ${base.getSerial()} added. Total ${base.listenerCount("guard mode")} Listener.`);
                break;
            case "PropertyChanged":
                base.on("property changed", (station, name, value) => this.onPropertyChanged(station, name, value));
                this.api.logDebug(`Listener 'PropertyChanged' for base ${base.getSerial()} added. Total ${base.listenerCount("property changed")} Listener.`);
                break;
            case "RawPropertyChanged":
                base.on("raw property changed", (station, type, value, modified) => this.onRawPropertyChanged(station, type, value, modified));
                this.api.logDebug(`Listener 'RawPropertyChanged' for base ${base.getSerial()} added. Total ${base.listenerCount("raw property changed")} Listener.`);
                break;
            case "RuntimeState":
                base.on("runtime state", (station, channel, batteryLevel, temperature, modified) => this.onStationRuntimeState(station, channel, batteryLevel, temperature, modified));
                this.api.logDebug(`Listener 'RuntimeState' for base ${base.getSerial()} added. Total ${base.listenerCount("runtime state")} Listener.`);
                break;
            case "ChargingState":
                base.on("charging state", (station, channel, chargeType, batteryLevel, modified) => this.onStationChargingState(station, channel, chargeType, batteryLevel, modified));
                this.api.logDebug(`Listener 'ChargingState' for base ${base.getSerial()} added. Total ${base.listenerCount("charging state")} Listener.`);
                break;
            case "WifiRssi":
                base.on("wifi rssi", (station, channel, rssi, modified) => this.onStationWifiRssi(station, channel, rssi, modified));
                this.api.logDebug(`Listener 'WifiRssi' for base ${base.getSerial()} added. Total ${base.listenerCount("wifi rssi")} Listener.`);
                break;
            case "RawDevicePropertyChanged":
                base.on("raw device property changed", (deviceSN, params) => this.onRawDevicePropertyChanged(deviceSN, params));
                this.api.logDebug(`Listener 'RawDevicePropertyChanged' for base ${base.getSerial()} added. Total ${base.listenerCount("raw device property changed")} Listener.`);
                break;
        }
    }
    /**
     * Add 5 seconds delayed a given event listener for a given base.
     * @param base The base as Station object.
     * @param eventListenerName The event listener name as string.
     */
    addEventListenerDelayed(base, eventListenerName) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, utils_1.sleep)(5000);
            switch (eventListenerName) {
                case "GuardModeChanged":
                    base.on("guard mode", (station, guardMode) => this.onStationGuardModeChanged(station, guardMode));
                    this.api.logDebug(`Listener 'GuardModeChanged' for base ${base.getSerial()} added delayed. Total ${base.listenerCount("guard mode")} Listener.`);
                    break;
                case "PropertyChanged":
                    base.on("property changed", (station, name, value) => this.onPropertyChanged(station, name, value));
                    this.api.logDebug(`Listener 'PropertyChanged' for base ${base.getSerial()} added delayed. Total ${base.listenerCount("property changed")} Listener.`);
                    break;
                case "RawPropertyChanged":
                    base.on("raw property changed", (station, type, value, modified) => this.onRawPropertyChanged(station, type, value, modified));
                    this.api.logDebug(`Listener 'RawPropertyChanged' for base ${base.getSerial()} added delayed. Total ${base.listenerCount("raw property changed")} Listener.`);
                    break;
                case "RuntimeState":
                    base.on("runtime state", (station, channel, batteryLevel, temperature, modified) => this.onStationRuntimeState(station, channel, batteryLevel, temperature, modified));
                    this.api.logDebug(`Listener 'RuntimeState' for base ${base.getSerial()} added delayed. Total ${base.listenerCount("runtime state")} Listener.`);
                    break;
                case "ChargingState":
                    base.on("charging state", (station, channel, chargeType, batteryLevel, modified) => this.onStationChargingState(station, channel, chargeType, batteryLevel, modified));
                    this.api.logDebug(`Listener 'ChargingState' for base ${base.getSerial()} added delayed. Total ${base.listenerCount("charging state")} Listener.`);
                    break;
                case "WifiRssi":
                    base.on("wifi rssi", (station, channel, rssi, modified) => this.onStationWifiRssi(station, channel, rssi, modified));
                    this.api.logDebug(`Listener 'WifiRssi' for base ${base.getSerial()} added delayed. Total ${base.listenerCount("wifi rssi")} Listener.`);
                    break;
                case "RawDevicePropertyChanged":
                    base.on("raw device property changed", (deviceSN, params) => this.onRawDevicePropertyChanged(deviceSN, params));
                    this.api.logDebug(`Listener 'RawDevicePropertyChanged' for base ${base.getSerial()} added delayed. Total ${base.listenerCount("raw device property changed")} Listener.`);
                    break;
            }
        });
    }
    /**
     * Remove all event listeners for a given event type for a given base.
     * @param base The base as Station object.
     * @param eventListenerName The event listener name as string.
     */
    removeEventListener(base, eventListenerName) {
        switch (eventListenerName) {
            case "GuardModeChanged":
                base.removeAllListeners("guard mode");
                this.api.logDebug(`Listener 'GuardModeChanged' for base ${base.getSerial()} removed. Total ${base.listenerCount("guard mode")} Listener.`);
                break;
            case "PropertyChanged":
                base.removeAllListeners("property changed");
                this.api.logDebug(`Listener 'PropertyChanged' for base ${base.getSerial()} removed. Total ${base.listenerCount("property changed")} Listener.`);
                break;
            case "RawPropertyChanged":
                base.removeAllListeners("raw property changed");
                this.api.logDebug(`Listener 'RawPropertyChanged' for base ${base.getSerial()} removed. Total ${base.listenerCount("raw property changed")} Listener.`);
                break;
            case "RuntimeState":
                base.removeAllListeners("runtime state");
                this.api.logDebug(`Listener 'RuntimeState' for base ${base.getSerial()} removed. Total ${base.listenerCount("runtime state")} Listener.`);
                break;
            case "ChargingState":
                base.removeAllListeners("charging state");
                this.api.logDebug(`Listener 'ChargingState' for base ${base.getSerial()} removed. Total ${base.listenerCount("charging state")} Listener.`);
                break;
            case "WifiRssi":
                base.removeAllListeners("wifi rssi");
                this.api.logDebug(`Listener 'WifiRssi' for base ${base.getSerial()} removed. Total ${base.listenerCount("wifi rssi")} Listener.`);
                break;
            case "RawDevicePropertyChanged":
                base.removeAllListeners("raw device property changed");
                this.api.logDebug(`Listener 'RawDevicePropertyChanged' for base ${base.getSerial()} removed. Total ${base.listenerCount("raw device property changed")} Listener.`);
                break;
        }
    }
    /**
     * Returns the number of attached listeners for a given base and a given event.
     * @param base The base the number of attached listners to count.
     * @param eventListenerName The name of the event the attached listeners to count.
     */
    countEventListener(base, eventListenerName) {
        switch (eventListenerName) {
            case "GuardModeChanged":
                return base.listenerCount("guard mode");
            case "PropertyChanged":
                return base.listenerCount("property changed");
            case "RawPropertyChanged":
                return base.listenerCount("raw property changed");
            case "RuntimeState":
                return base.listenerCount("runtime state");
            case "ChargingState":
                return base.listenerCount("charging state");
            case "WifiRssi":
                return base.listenerCount("wifi rssi");
            case "RawDevicePropertyChanged":
                return base.listenerCount("raw device property changed");
        }
        return -1;
    }
    /**
     * The action to be one when event GuardModeChanged is fired.
     * @param station The base as Station object.
     * @param guardMode The new guard mode as GuardMode.
     * @param currentMode The new current mode as GuardMode.
     */
    onStationGuardModeChanged(station, guardMode) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.skipNextModeChangeEvent[station.getSerial()] == true) {
                this.api.logDebug("Event skipped due to locally forced changeGuardMode.");
                this.skipNextModeChangeEvent[station.getSerial()] = false;
            }
            else {
                this.api.logDebug(`Event "PropertyChanged": base: ${station.getSerial()} | guard mode: ${guardMode}`);
                yield this.api.updateGuardModeBase(station.getSerial());
            }
        });
    }
    /**
     * The action to be one when event PropertyChanged is fired.
     * @param station The base as Station object.
     * @param name The name of the changed value.
     * @param value The value and timestamp of the new value as PropertyValue.
     */
    onPropertyChanged(station, name, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (name != "guardMode" && name != "currentMode") {
                this.api.logDebug(`Event "PropertyChanged": base: ${station.getSerial()} | name: ${name} | value: ${value.value}`);
            }
        });
    }
    /**
     * The action to be one when event RawPropertyChanged is fired.
     * @param station The base as Station object.
     * @param type The number of the raw-value in the eufy ecosystem.
     * @param value The new value as string.
     * @param modified The timestamp of the last change.
     */
    onRawPropertyChanged(station, type, value, modified) {
        return __awaiter(this, void 0, void 0, function* () {
            if (type != 1102 && type != 1137 && type != 1147 && type != 1151 && type != 1154 && type != 1162 && type != 1165 && type != 1224 && type != 1279 && type != 1281 && type != 1282 && type != 1283 && type != 1284 && type != 1285 && type != 1660 && type != 1664 && type != 1665) {
                this.api.logDebug(`Event "RawPropertyChanged": base: ${station.getSerial()} | type: ${type} | value: ${value}`);
            }
        });
    }
    /**
     * The action to be one when event StationRuntimeState is fired.
     * @param station The base as Station object.
     * @param channel The cannel to define the device.
     * @param batteryLevel The battery level as percentage value.
     * @param temperature The temperature as degree value.
     * @param modified The datetime stamp the values have changed.
     */
    onStationRuntimeState(station, channel, batteryLevel, temperature, modified) {
        this.api.logDebug(`Event "RuntimeState": base: ${station.getSerial()} | channel: ${channel} | battery: ${batteryLevel} | temperature: ${temperature}`);
        this.devices.updateBatteryValues(station.getSerial(), channel, batteryLevel, temperature, modified);
    }
    /**
     * The action to be one when event StationChargingState is fired.
     * @param station The base as Station object.
     * @param channel The cannel to define the device.
     * @param chargeType The current carge state.
     * @param batteryLevel The battery level as percentage value.
     * @param modified The datetime stamp the values have changed.
     */
    onStationChargingState(station, channel, chargeType, batteryLevel, modified) {
        this.api.logDebug(`Event "ChargingState": base: ${station.getSerial()} | channel: ${channel} | battery: ${batteryLevel} | type: ${chargeType}`);
        this.devices.updateChargingState(station.getSerial(), channel, chargeType, batteryLevel, modified);
    }
    /**
     * The action to be one when event StationWifiRssi is fired.
     * @param station The base as Station object.
     * @param channel The cannel to define the device.
     * @param rssi The current rssi value.
     * @param modified The datetime stamp the values have changed.
     */
    onStationWifiRssi(station, channel, rssi, modified) {
        this.api.logDebug(`Event "WifiRssi": base: ${station.getSerial()} | channel: ${channel} | rssi: ${rssi}`);
        this.devices.updateWifiRssi(station.getSerial(), channel, rssi, modified);
    }
    /**
     * The action to be one when event RawDevicePropertyChanged is fired.
     * @param deviceSerial The serial of the device the raw values changed for.
     * @param values The raw values for the device.
     */
    onRawDevicePropertyChanged(deviceSerial, values) {
        this.api.logDebug(`Event "RawDevicePropertyChanged": device: ${deviceSerial} | values: ${values}`);
        this.devices.updateDeviceProperties(deviceSerial, values);
    }
}
exports.Bases = Bases;
