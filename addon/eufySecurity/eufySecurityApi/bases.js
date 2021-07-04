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
     * (Re)Loads all Bases and the settings of them.
     */
    loadBases() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.httpService.updateDeviceInfo();
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
                            yield this.bases[stationSerial].connect(this.api.getP2PConnectionType());
                            if (this.api.getApiUseUpdateStateEvent()) {
                                this.addEventListenerInstantly(this.bases[stationSerial], "GuardModeChanged");
                                this.addEventListenerInstantly(this.bases[stationSerial], "PropertyChanged");
                                this.addEventListenerInstantly(this.bases[stationSerial], "RawPropertyChanged");
                            }
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
                    }
                }
            }
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
     * Returns a JSON-Representation of all Bases including the guard mode.
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
            var cnt = 0;
            for (var stationSerial in this.bases) {
                this.skipNextModeChangeEvent[stationSerial] = true;
                yield this.bases[stationSerial].setGuardMode(guardMode);
                yield utils_1.sleep(1500);
                yield this.loadBases();
                if (this.bases[stationSerial].getGuardMode().value != guardMode) {
                    cnt = cnt + 1;
                }
            }
            if (cnt == 0) {
                return true;
            }
            else {
                return false;
            }
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
            yield utils_1.sleep(1500);
            yield this.loadBases();
            if (this.bases[baseSerial].getGuardMode().value == guardMode) {
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
                base.on("guard mode", (station, guardMode, currentMode) => this.onStationGuardModeChanged(station, guardMode, currentMode));
                this.api.logDebug(`Listener 'GuardModeChanged' for base ${base.getSerial()} added. Total ${base.listenerCount("guard mode")} Listener.`);
                break;
            case "PropertyChanged":
                base.on("property changed", (station, name, value) => this.onPropertyChanged(station, name, value));
                this.api.logDebug(`Listener 'PropertyChanged' for base ${base.getSerial()} added. Total ${base.listenerCount("property changed")} Listener.`);
                break;
            case "RawPropertyChanged":
                base.on("raw property changed", (station, type, value, modified) => this.onRawPropertyChanged(station, type, value, modified));
                this.api.logDebug(`Listener 'RawPropertyChanged' for base ${base.getSerial()} added. Total ${base.listenerCount("property changed")} Listener.`);
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
            yield utils_1.sleep(5000);
            switch (eventListenerName) {
                case "GuardModeChanged":
                    base.on("guard mode", (station, guardMode, currentMode) => this.onStationGuardModeChanged(station, guardMode, currentMode));
                    this.api.logDebug(`Listener 'GuardModeChanged' for base ${base.getSerial()} added delayed. Total ${base.listenerCount("guard mode")} Listener.`);
                    break;
                case "PropertyChanged":
                    base.on("property changed", (station, name, value) => this.onPropertyChanged(station, name, value));
                    this.api.logDebug(`Listener 'PropertyChanged' for base ${base.getSerial()} added delayed. Total ${base.listenerCount("property changed")} Listener.`);
                    break;
                case "RawPropertyChanged":
                    base.on("raw property changed", (station, type, value, modified) => this.onRawPropertyChanged(station, type, value, modified));
                    this.api.logDebug(`Listener 'RawPropertyChanged' for base ${base.getSerial()} added delayed. Total ${base.listenerCount("property changed")} Listener.`);
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
                this.api.logDebug(`Listener 'RawPropertyChanged' for base ${base.getSerial()} removed. Total ${base.listenerCount("property changed")} Listener.`);
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
        }
        return -1;
    }
    /**
     * The action to be one when event GuardModeChanged is fired.
     * @param station The base as Station object.
     * @param guardMode The new guard mode as GuardMode.
     * @param currentMode The new current mode as GuardMode.
     */
    onStationGuardModeChanged(station, guardMode, currentMode) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.skipNextModeChangeEvent[station.getSerial()] == true) {
                this.api.logDebug("Event skipped due to locally forced changeGuardMode.");
                this.skipNextModeChangeEvent[station.getSerial()] = false;
            }
            else {
                this.api.logDebug("Station serial: " + station.getSerial() + " ::: Guard Mode: " + guardMode + " ::: Current Mode: " + currentMode);
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
                this.api.logDebug("Station serial: " + station.getSerial() + " ::: Name: " + name + " ::: Value: " + value.value);
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
                this.api.logDebug("Station serial: " + station.getSerial() + " ::: Type: " + type + " ::: Value: " + value + " ::: Modified: " + modified);
            }
        });
    }
}
exports.Bases = Bases;
