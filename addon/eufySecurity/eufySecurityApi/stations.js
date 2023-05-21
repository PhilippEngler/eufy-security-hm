"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stations = void 0;
const tiny_typed_emitter_1 = require("tiny-typed-emitter");
const http_1 = require("./http");
const utils_1 = require("./push/utils");
const error_1 = require("./error");
const events_1 = __importDefault(require("events"));
const image_type_1 = __importDefault(require("image-type"));
const p2p_1 = require("./p2p");
const utils_2 = require("./utils");
const utils_3 = require("./utils/utils");
const path_1 = __importDefault(require("path"));
/**
 * Represents all the stations in the account.
 */
class Stations extends tiny_typed_emitter_1.TypedEmitter {
    /**
     * Create the Bases objects holding all stations in the account.
     * @param api The eufySecurityApi.
     * @param httpService The httpService.
     */
    constructor(api, httpService) {
        super();
        this.stations = {};
        this.skipNextModeChangeEvent = {};
        this.lastGuardModeChangeTimeForStations = {};
        this.stationsLoaded = false;
        this.loadingEmitter = new events_1.default();
        this.P2P_REFRESH_INTERVAL_MIN = 720;
        this.cameraMaxLivestreamSeconds = 30;
        this.cameraStationLivestreamTimeout = new Map();
        this.cameraCloudLivestreamTimeout = new Map();
        this.refreshEufySecurityP2PTimeout = {};
        this.api = api;
        this.httpService = httpService;
        this.serialNumbers = [];
        if (this.api.getStateUpdateEventActive() == false) {
            this.api.logInfoBasic("Retrieving last guard mode change times disabled in settings.");
        }
        this.httpService.on("hubs", (hubs) => this.handleHubs(hubs));
    }
    /**
     * Put all stations and their settings in format so that we can work with them.
     * @param hubs The object containing the stations.
     */
    async handleHubs(hubs) {
        this.api.logDebug("Got hubs:", hubs);
        const resStations = hubs;
        var station;
        const stationsSerials = Object.keys(this.stations);
        const promises = [];
        const newStationsSerials = Object.keys(hubs);
        for (var stationSerial in resStations) {
            if (this.api.getHouseId() !== undefined && resStations[stationSerial].house_id !== undefined && this.api.getHouseId() !== "all" && resStations[stationSerial].house_id !== this.api.getHouseId()) {
                this.api.logDebug(`Station ${stationSerial} does not match houseId (got ${resStations[stationSerial].house_id} want ${this.api.getHouseId()}).`);
                continue;
            }
            if (this.stations[stationSerial]) {
                await this.updateStation(resStations[stationSerial]);
            }
            else {
                this.stationsLoaded = false;
                station = await http_1.Station.getInstance(this.api, this.httpService, resStations[stationSerial]);
                this.skipNextModeChangeEvent[stationSerial] = false;
                this.lastGuardModeChangeTimeForStations[stationSerial] = undefined;
                this.serialNumbers.push(stationSerial);
                station.setConnectionType(this.api.getP2PConnectionType());
                station.connect();
                if (this.api.getStateUpdateEventActive()) {
                    this.addEventListener(station, "GuardMode", false);
                    this.addEventListener(station, "CurrentMode", false);
                    this.addEventListener(station, "PropertyChanged", false);
                    this.addEventListener(station, "RawPropertyChanged", false);
                }
                this.addEventListener(station, "Connect", false);
                this.addEventListener(station, "ConnectionError", false);
                this.addEventListener(station, "Close", false);
                this.addEventListener(station, "RawDevicePropertyChanged", false);
                this.addEventListener(station, "LivestreamStart", false);
                this.addEventListener(station, "LivestreamStop", false);
                this.addEventListener(station, "LivestreamError", false);
                this.addEventListener(station, "DownloadStart", false);
                this.addEventListener(station, "DownloadFinish", false);
                this.addEventListener(station, "CommandResult", false);
                this.addEventListener(station, "RTSPLivestreamStart", false);
                this.addEventListener(station, "RTSPLivestreamStop", false);
                this.addEventListener(station, "RTSPUrl", false);
                this.addEventListener(station, "AlarmEvent", false);
                this.addEventListener(station, "RuntimeState", false);
                this.addEventListener(station, "ChargingState", false);
                this.addEventListener(station, "WifiRssi", false);
                this.addEventListener(station, "FloodlightManualSwitch", false);
                this.addEventListener(station, "AlarmDelayEvent", false);
                this.addEventListener(station, "TalkbackStarted", false);
                this.addEventListener(station, "TalkbackStopped", false);
                this.addEventListener(station, "TalkbackError", false);
                this.addEventListener(station, "AlarmArmedEvent", false);
                this.addEventListener(station, "AlarmArmDelayEvent", false);
                this.addEventListener(station, "SecondaryCommandResult", false);
                this.addEventListener(station, "DeviceShakeAlarm", false);
                this.addEventListener(station, "Device911Alarm", false);
                this.addEventListener(station, "DeviceJammed", false);
                this.addEventListener(station, "DeviceLowBattery", false);
                this.addEventListener(station, "DeviceWrongTryProtectAlarm", false);
                this.addEventListener(station, "DevicePinVerified", false);
                this.addEventListener(station, "SdInfoEx", false);
                this.addEventListener(station, "ImageDownload", false);
                this.addEventListener(station, "DatabaseQueryLocal", false);
                this.addStation(station);
                station.initialize();
            }
        }
        Promise.all(promises).then(() => {
            this.stationsLoaded = true;
            this.loadingEmitter.emit("stations loaded");
        });
        if (promises.length === 0) {
            this.stationsLoaded = true;
            this.loadingEmitter.emit("stations loaded");
        }
        for (const stationSerial of stationsSerials) {
            if (!newStationsSerials.includes(stationSerial)) {
                this.getStation(stationSerial).then((station) => {
                    this.removeStation(station);
                }).catch((error) => {
                    this.api.logError("Error removing station", error);
                });
            }
        }
        this.saveStationsSettings();
    }
    /**
     * Add the given station for using.
     * @param station The station object to add.
     */
    addStation(station) {
        const serial = station.getSerial();
        if (serial && !Object.keys(this.stations).includes(serial)) {
            this.stations[serial] = station;
            this.getStorageInfo(serial);
            this.emit("station added", station);
        }
        else {
            this.api.logDebug(`Station with this serial ${station.getSerial()} exists already and couldn't be added again!`);
        }
    }
    /**
     * Remove the given station.
     * @param station The station object to remove.
     */
    removeStation(station) {
        const serial = station.getSerial();
        if (serial && Object.keys(this.stations).includes(serial)) {
            delete this.stations[serial];
            station.removeAllListeners();
            if (station.isConnected()) {
                station.close();
            }
            this.emit("station removed", station);
        }
        else {
            this.api.logDebug(`Station with this serial ${station.getSerial()} doesn't exists and couldn't be removed!`);
        }
    }
    /**
     * Update the station information.
     * @param hub The object containg the specific hub.
     */
    async updateStation(hub) {
        if (!this.stationsLoaded) {
            await (0, utils_2.waitForEvent)(this.loadingEmitter, "stations loaded");
        }
        if (Object.keys(this.stations).includes(hub.station_sn)) {
            this.stations[hub.station_sn].update(hub, this.stations[hub.station_sn] !== undefined && !this.stations[hub.station_sn].isIntegratedDevice() && this.stations[hub.station_sn].isConnected());
            if (!this.stations[hub.station_sn].isConnected() && !this.stations[hub.station_sn].isEnergySavingDevice()) {
                this.stations[hub.station_sn].setConnectionType(this.api.getP2PConnectionType());
                this.stations[hub.station_sn].connect();
            }
            this.getStorageInfo(hub.station_sn);
        }
        else {
            this.api.logError(`Station with this serial ${hub.station_sn} doesn't exists and couldn't be updated!`);
        }
    }
    /**
     * (Re)Loads all stations and the settings of them.
     */
    async loadStations() {
        try {
            await this.handleHubs(this.httpService.getHubs());
        }
        catch (e) {
            this.stations = {};
            throw new Error(e);
        }
    }
    /**
     * Close all Livestreams.
     */
    async close() {
        for (const device_sn of this.cameraStationLivestreamTimeout.keys()) {
            this.stopStationLivestream(device_sn);
        }
        for (const device_sn of this.cameraCloudLivestreamTimeout.keys()) {
            this.stopCloudLivestream(device_sn);
        }
        await this.closeP2PConnections();
    }
    /**
     * Close all P2P connection for all stations.
     */
    async closeP2PConnections() {
        if (this.stations != null) {
            for (var stationSerial in this.stations) {
                if (this.stations[stationSerial]) {
                    await this.stations[stationSerial].close();
                    this.removeEventListener(this.stations[stationSerial], "GuardMode");
                    this.removeEventListener(this.stations[stationSerial], "CurrentMode");
                    this.removeEventListener(this.stations[stationSerial], "PropertyChanged");
                    this.removeEventListener(this.stations[stationSerial], "RawPropertyChanged");
                    this.removeEventListener(this.stations[stationSerial], "Connect");
                    this.removeEventListener(this.stations[stationSerial], "ConnectionError");
                    this.removeEventListener(this.stations[stationSerial], "Close");
                    this.removeEventListener(this.stations[stationSerial], "RawDevicePropertyChanged");
                    this.removeEventListener(this.stations[stationSerial], "LivestreamStart");
                    this.removeEventListener(this.stations[stationSerial], "LivestreamStop");
                    this.removeEventListener(this.stations[stationSerial], "LivestreamError");
                    this.removeEventListener(this.stations[stationSerial], "DownloadStart");
                    this.removeEventListener(this.stations[stationSerial], "DownloadFinish");
                    this.removeEventListener(this.stations[stationSerial], "CommandResult");
                    this.removeEventListener(this.stations[stationSerial], "RTSPLivestreamStart");
                    this.removeEventListener(this.stations[stationSerial], "RTSPLivestreamStop");
                    this.removeEventListener(this.stations[stationSerial], "RTSPUrl");
                    this.removeEventListener(this.stations[stationSerial], "AlarmEvent");
                    this.removeEventListener(this.stations[stationSerial], "RuntimeState");
                    this.removeEventListener(this.stations[stationSerial], "ChargingState");
                    this.removeEventListener(this.stations[stationSerial], "WifiRssi");
                    this.removeEventListener(this.stations[stationSerial], "FloodlightManualSwitch");
                    this.removeEventListener(this.stations[stationSerial], "AlarmDelayEvent");
                    this.removeEventListener(this.stations[stationSerial], "TalkbackStarted");
                    this.removeEventListener(this.stations[stationSerial], "TalkbackStopped");
                    this.removeEventListener(this.stations[stationSerial], "TalkbackError");
                    this.removeEventListener(this.stations[stationSerial], "AlarmArmedEvent");
                    this.removeEventListener(this.stations[stationSerial], "AlarmArmDelayEvent");
                    this.removeEventListener(this.stations[stationSerial], "SecondaryCommandResult");
                    this.removeEventListener(this.stations[stationSerial], "DeviceShakeAlarm");
                    this.removeEventListener(this.stations[stationSerial], "Device911Alarm");
                    this.removeEventListener(this.stations[stationSerial], "DeviceJammed");
                    this.removeEventListener(this.stations[stationSerial], "DeviceLowBattery");
                    this.removeEventListener(this.stations[stationSerial], "DeviceWrongTryProtectAlarm");
                    this.removeEventListener(this.stations[stationSerial], "DevicePinVerified");
                    this.removeEventListener(this.stations[stationSerial], "SdInfoEx");
                    this.removeEventListener(this.stations[stationSerial], "ImageDownload");
                    this.removeEventListener(this.stations[stationSerial], "DatabaseQueryLocal");
                    clearTimeout(this.refreshEufySecurityP2PTimeout[stationSerial]);
                    delete this.refreshEufySecurityP2PTimeout[stationSerial];
                }
            }
        }
    }
    /**
     * Update the infos of all connected devices over P2P.
     */
    async updateDeviceData() {
        await this.httpService.refreshAllData().catch(error => {
            this.api.logError("Error occured at updateDeviceData while API data refreshing.", error);
        });
        Object.values(this.stations).forEach(async (station) => {
            if (station.isConnected() && station.getDeviceType() !== http_1.DeviceType.DOORBELL) {
                await station.getCameraInfo().catch(error => {
                    this.api.logError(`Error occured at updateDeviceData while station ${station.getSerial()} p2p data refreshing.`, error);
                });
            }
        });
    }
    /**
     * Set the maximum livestream duration.
     * @param seconds The maximum duration in secons.
     */
    setCameraMaxLivestreamDuration(seconds) {
        this.cameraMaxLivestreamSeconds = seconds;
    }
    /**
     * Get the maximum livestream duration.
     */
    getCameraMaxLivestreamDuration() {
        return this.cameraMaxLivestreamSeconds;
    }
    /**
     * Start the livestream from station for a given device.
     * @param deviceSerial The serial of the device.
     */
    async startStationLivestream(deviceSerial) {
        const device = await this.api.getDevice(deviceSerial);
        const station = await this.getStation(device.getStationSerial());
        if (!device.hasCommand(http_1.CommandName.DeviceStartLivestream)) {
            throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
        }
        const camera = device;
        if (!station.isLiveStreaming(camera)) {
            station.startLivestream(camera);
            if (this.cameraMaxLivestreamSeconds > 0) {
                this.cameraStationLivestreamTimeout.set(deviceSerial, setTimeout(() => {
                    this.api.logInfo(`Stopping the station stream for the device ${deviceSerial}, because we have reached the configured maximum stream timeout (${this.cameraMaxLivestreamSeconds} seconds)`);
                    this.stopStationLivestream(deviceSerial);
                }, this.cameraMaxLivestreamSeconds * 1000));
            }
        }
        else {
            this.api.logWarn(`The station stream for the device ${deviceSerial} cannot be started, because it is already streaming!`);
        }
    }
    /**
     * Start the livestream from cloud for a given device.
     * @param deviceSerial The serial of the device.
     */
    async startCloudLivestream(deviceSerial) {
        const device = await this.api.getDevice(deviceSerial);
        const station = await this.getStation(device.getStationSerial());
        if (!device.hasCommand(http_1.CommandName.DeviceStartLivestream)) {
            throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
        }
        const camera = device;
        if (!camera.isStreaming()) {
            const url = await camera.startStream();
            if (url !== "") {
                if (this.cameraMaxLivestreamSeconds > 0) {
                    this.cameraCloudLivestreamTimeout.set(deviceSerial, setTimeout(() => {
                        this.api.logInfo(`Stopping the station stream for the device ${deviceSerial}, because we have reached the configured maximum stream timeout (${this.cameraMaxLivestreamSeconds} seconds)`);
                        this.stopCloudLivestream(deviceSerial);
                    }, this.cameraMaxLivestreamSeconds * 1000));
                }
                this.emit("cloud livestream start", station, camera, url);
            }
            else {
                this.api.logError(`Failed to start cloud stream for the device ${deviceSerial}`);
            }
        }
        else {
            this.api.logWarn(`The cloud stream for the device ${deviceSerial} cannot be started, because it is already streaming!`);
        }
    }
    /**
     * Stop the livestream from station for a given device.
     * @param deviceSerial The serial of the device.
     */
    async stopStationLivestream(deviceSerial) {
        const device = await this.api.getDevice(deviceSerial);
        const station = await this.getStation(device.getStationSerial());
        if (!device.hasCommand(http_1.CommandName.DeviceStopLivestream)) {
            throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
        }
        if (station.isConnected() && station.isLiveStreaming(device)) {
            await station.stopLivestream(device);
        }
        else {
            this.api.logWarn(`The station stream for the device ${deviceSerial} cannot be stopped, because it isn't streaming!`);
        }
        const timeout = this.cameraStationLivestreamTimeout.get(deviceSerial);
        if (timeout) {
            clearTimeout(timeout);
            this.cameraStationLivestreamTimeout.delete(deviceSerial);
        }
    }
    /**
     * Stop the livestream from cloud for a given device.
     * @param deviceSerial The serial of the device.
     */
    async stopCloudLivestream(deviceSerial) {
        const device = await this.api.getDevice(deviceSerial);
        const station = await this.getStation(device.getStationSerial());
        if (!device.hasCommand(http_1.CommandName.DeviceStopLivestream)) {
            throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
        }
        const camera = device;
        if (camera.isStreaming()) {
            await camera.stopStream();
            this.emit("cloud livestream stop", station, camera);
        }
        else {
            this.api.logWarn(`The cloud stream for the device ${deviceSerial} cannot be stopped, because it isn't streaming!`);
        }
        const timeout = this.cameraCloudLivestreamTimeout.get(deviceSerial);
        if (timeout) {
            clearTimeout(timeout);
            this.cameraCloudLivestreamTimeout.delete(deviceSerial);
        }
    }
    /**
     * Save the relevant settings (mainly for P2P-Connection) to the config
     */
    async saveStationsSettings() {
        await this.api.saveStationsSettings(this.stations);
    }
    /**
     * Returns a Array of all stations.
     */
    async getStations() {
        if (!this.stationsLoaded) {
            await (0, utils_2.waitForEvent)(this.loadingEmitter, "stations loaded");
        }
        return this.stations;
    }
    /**
     * Returns the serial object specified by the station serial.
     * @param stationSerial The serial of the station to retrive.
     * @returns The station object.
     */
    async getStation(stationSerial) {
        if (!this.stationsLoaded) {
            await (0, utils_2.waitForEvent)(this.loadingEmitter, "stations loaded");
        }
        if (Object.keys(this.stations).includes(stationSerial)) {
            return this.stations[stationSerial];
        }
        throw new error_1.StationNotFoundError(`No station with serial number: ${stationSerial}!`);
    }
    /**
     * Checks if a station with the given serial exists.
     * @param stationSerial The stationSerial of the station to check.
     * @returns True if station exists, otherwise false.
     */
    existStation(stationSerial) {
        var res = this.stations[stationSerial];
        if (res) {
            return true;
        }
        else {
            return false;
        }
    }
    /**
     * Get the guard mode for all stations.
     */
    getGuardMode() {
        var res = {};
        for (var stationSerial in this.stations) {
            res[stationSerial] = this.stations[stationSerial].getGuardMode();
        }
        return res;
    }
    /**
     * Set the guard mode of all stations to the given mode.
     * @param guardMode The target guard mode.
     */
    async setGuardMode(guardMode) {
        var err = 0;
        for (var stationSerial in this.stations) {
            if (await this.setGuardModeStation(stationSerial, guardMode) == false) {
                err = err + 1;
            }
        }
        if (err == 0) {
            return true;
        }
        else {
            return false;
        }
    }
    /**
     * Set the guard mode for the given station to the given mode.
     * @param stationSerial The serial of the station the mode to change.
     * @param guardMode The target guard mode.
     */
    async setGuardModeStation(stationSerial, guardMode) {
        if (this.stations[stationSerial].getGuardMode() === guardMode) {
            return true;
        }
        else {
            var res;
            res = await this.waitForGuardModeEvent(this.stations[stationSerial], guardMode, 10000).then(() => {
                return true;
            }, (value) => {
                if (typeof value === "boolean") {
                    return false;
                }
                else {
                    throw value;
                }
            });
            if (res == true) {
                this.setLastGuardModeChangeTimeNow(stationSerial);
                this.api.updateStationGuardModeSystemVariable(stationSerial, guardMode);
            }
            return res;
        }
    }
    /**
     * Wait for the GuardModeEvent after changing guardMode for a given base.
     * @param station The sation for waiting for the GuardMode event.
     * @param guardMode The guard mode to set.
     * @param timeout The timespan in ms maximal to wait for the event.
     * @returns Returns true or false.
     */
    async waitForGuardModeEvent(station, guardMode, timeout) {
        return new Promise(async (resolve, reject) => {
            var timer;
            var funcListener = () => listener();
            function listener() {
                station.removeListener("guard mode", funcListener);
                clearTimeout(timer);
                resolve(true);
            }
            station.addListener("guard mode", funcListener);
            timer = setTimeout(() => {
                station.removeListener("guard mode", funcListener);
                reject(false);
            }, timeout);
            try {
                await this.setStationProperty(station.getSerial(), http_1.PropertyName.StationGuardMode, guardMode);
            }
            catch (e) {
                station.removeListener("guard mode", funcListener);
                reject(e);
            }
        });
    }
    /**
     * Retrieves the storage information from ether all station or a given station.
     * @param stationSerial The serial of the station.
     */
    async getStorageInfo(stationSerial) {
        if (stationSerial === undefined) {
            for (var serial in this.stations) {
                await this.getStorageInfoStation(serial);
            }
        }
        else {
            await this.getStorageInfoStation(stationSerial);
        }
    }
    /**
     * Retrieves the storage information from the given station.
     * @param stationSerial The serial of the station.
     */
    async getStorageInfoStation(stationSerial) {
        try {
            const station = await this.getStation(stationSerial);
            if (station.isStation() || (station.hasProperty(http_1.PropertyName.StationSdStatus) && station.getPropertyValue(http_1.PropertyName.StationSdStatus) !== undefined && station.getPropertyValue(http_1.PropertyName.StationSdStatus) !== p2p_1.TFCardStatus.REMOVE)) {
                await station.getStorageInfoEx();
            }
        }
        catch (error) {
            this.api.logError("getStorageInfo Error", error);
        }
    }
    /**
     * Add a given event listener for a given station.
     * @param station The station as Station object.
     * @param eventListenerName The event listener name as string.
     * @param delayed false if add instantly, for a 5s delay set true.
     */
    async addEventListener(station, eventListenerName, delayed) {
        if (delayed == true) {
            await (0, utils_1.sleep)(5000);
        }
        switch (eventListenerName) {
            case "Connect":
                station.on("connect", (station) => this.onStationConnect(station));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("connect")} Listener.`);
                break;
            case "ConnectionError":
                station.on("connection error", (station, error) => this.onStationConnectionError(station, error));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("connection error")} Listeners.`);
                break;
            case "Close":
                station.on("close", (station) => this.onStationClose(station));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("close")} Listener.`);
                break;
            case "RawDevicePropertyChanged":
                station.on("raw device property changed", (deviceSerial, params) => this.onStationRawDevicePropertyChanged(deviceSerial, params));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("raw device property changed")} Listener.`);
                break;
            case "LivestreamStart":
                station.on("livestream start", (station, channel, metadata, videoStream, audioStream) => this.onStationLivestreamStart(station, channel, metadata, videoStream, audioStream));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("livestream start")} Listener.`);
                break;
            case "LivestreamStop":
                station.on("livestream stop", (station, channel) => this.onStationLivestreamStop(station, channel));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("livestream stop")} Listener.`);
                break;
            case "LivestreamError":
                station.on("livestream error", (station, channel) => this.onStationLivestreamError(station, channel));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("livestream error")} Listener.`);
                break;
            case "DownloadStart":
                station.on("download start", (station, channel, metadata, videoStream, audioStream) => this.onStationDownloadStart(station, channel, metadata, videoStream, audioStream));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("download start")} Listener.`);
                break;
            case "DownloadFinish":
                station.on("download finish", (station, channel) => this.onStationDownloadFinish(station, channel));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("download finish")} Listener.`);
                break;
            case "CommandResult":
                station.on("command result", (station, result) => this.onStationCommandResult(station, result));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("command result")} Listener.`);
                break;
            case "GuardMode":
                station.on("guard mode", (station, guardMode) => this.onStationGuardMode(station, guardMode));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("guard mode")} Listener.`);
                break;
            case "CurrentMode":
                station.on("current mode", (station, guardMode) => this.onStationCurrentMode(station, guardMode));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("current mode")} Listener.`);
                break;
            case "RTSPLivestreamStart":
                station.on("rtsp livestream start", (station, channel) => this.onStationRTSPLivestreamStart(station, channel));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("rtsp livestream start")} Listener.`);
                break;
            case "RTSPLivestreamStop":
                station.on("rtsp livestream stop", (station, channel) => this.onStationRTSPLivestreamStop(station, channel));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("rtsp livestream stop")} Listener.`);
                break;
            case "RTSPUrl":
                station.on("rtsp url", (station, channel, value) => this.onStationRTSPURL(station, channel, value));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("rtsp url")} Listener.`);
                break;
            case "PropertyChanged":
                station.on("property changed", (station, name, value, ready) => this.onStationPropertyChanged(station, name, value, ready));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("property changed")} Listener.`);
                break;
            case "RawPropertyChanged":
                station.on("raw property changed", (station, type, value) => this.onStationRawPropertyChanged(station, type, value));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("raw property changed")} Listener.`);
                break;
            case "AlarmEvent":
                station.on("alarm event", (station, alarmEvent) => this.onStationAlarmEvent(station, alarmEvent));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("alarm event")} Listener.`);
                break;
            case "RuntimeState":
                station.on("runtime state", (station, channel, batteryLevel, temperature) => this.onStationRuntimeState(station, channel, batteryLevel, temperature));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("runtime state")} Listener.`);
                break;
            case "ChargingState":
                station.on("charging state", (station, channel, chargeType, batteryLevel) => this.onStationChargingState(station, channel, chargeType, batteryLevel));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("charging state")} Listener.`);
                break;
            case "WifiRssi":
                station.on("wifi rssi", (station, channel, rssi) => this.onStationWifiRssi(station, channel, rssi));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("wifi rssi")} Listener.`);
                break;
            case "FloodlightManualSwitch":
                station.on("floodlight manual switch", (station, channel, enabled) => this.onStationFloodlightManualSwitch(station, channel, enabled));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("floodlight manual switch")} Listener.`);
                break;
            case "AlarmDelayEvent":
                station.on("alarm delay event", (station, alarmDelayEvent, alarmDelay) => this.onStationAlarmDelayEvent(station, alarmDelayEvent, alarmDelay));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("alarm delay event")} Listener.`);
                break;
            case "TalkbackStarted":
                station.on("talkback started", (station, channel, talkbackStream) => this.onStationTalkbackStarted(station, channel, talkbackStream));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("talkback started")} Listener.`);
                break;
            case "TalkbackStopped":
                station.on("talkback stopped", (station, channel) => this.onStationTalkbackStopped(station, channel));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("talkback stopped")} Listener.`);
                break;
            case "TalkbackError":
                station.on("talkback error", (station, channel, error) => this.onStationTalkbackError(station, channel, error));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("talkback error")} Listener.`);
                break;
            case "AlarmArmedEvent":
                station.on("alarm armed event", (station) => this.onStationAlarmArmedEvent(station));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("alarm armed event")} Listener.`);
                break;
            case "AlarmArmDelayEvent":
                station.on("alarm arm delay event", (station, alarmDelay) => this.onStationArmDelayEvent(station, alarmDelay));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("alarm arm delay event")} Listener.`);
                break;
            case "SecondaryCommandResult":
                station.on("secondary command result", (station, result) => this.onStationSecondaryCommandResult(station, result));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("secondary command result")} Listener.`);
                break;
            case "DeviceShakeAlarm":
                station.on("device shake alarm", (deviceSerial, event) => this.onStationDeviceShakeAlarm(deviceSerial, event));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("device shake alarm")} Listener.`);
                break;
            case "Device911Alarm":
                station.on("device 911 alarm", (deviceSerial, event) => this.onStationDevice911Alarm(deviceSerial, event));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("device 911 alarm")} Listener.`);
                break;
            case "DeviceJammed":
                station.on("device jammed", (deviceSerial) => this.onStationDeviceJammed(deviceSerial));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("device jammed")} Listener.`);
                break;
            case "DeviceLowBattery":
                station.on("device low battery", (deviceSerial) => this.onStationDeviceLowBattery(deviceSerial));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("device low battery")} Listener.`);
                break;
            case "DeviceWrongTryProtectAlarm":
                station.on("device wrong try-protect alarm", (deviceSerial) => this.onStationDeviceWrongTryProtectAlarm(deviceSerial));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("device wrong try-protect alarm")} Listener.`);
                break;
            case "DevicePinVerified":
                station.on("device pin verified", (deviceSN, successfull) => this.onStationDevicePinVerified(deviceSN, successfull));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("device pin verified")} Listener.`);
                break;
            case "SdInfoEx":
                station.on("sd info ex", (station, sdStatus, sdCapacity, sdCapacityAvailable) => this.onStationSdInfoEx(station, sdStatus, sdCapacity, sdCapacityAvailable));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("sd info ex")} Listener.`);
                break;
            case "ImageDownload":
                station.on("image download", (station, file, image) => this.onStationImageDownload(station, file, image));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("image download")} Listener.`);
                break;
            case "DatabaseQueryLocal":
                station.on("database query local", (station, returnCode, data) => this.onStationDatabaseQueryLocal(station, returnCode, data));
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("database query local")} Listener.`);
                break;
            default:
                this.api.logInfo(`The listener '${eventListenerName}' for station ${station.getSerial()} is unknown.`);
        }
    }
    /**
     * Remove all event listeners for a given event type for a given station.
     * @param station The station as Station object.
     * @param eventListenerName The event listener name as string.
     */
    removeEventListener(station, eventListenerName) {
        switch (eventListenerName) {
            case "Connect":
                station.removeAllListeners("connect");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("connect")} Listener.`);
                break;
            case "ConnectionError":
                station.removeAllListeners("connection error");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("connection error")} Listener.`);
                break;
            case "Close":
                station.removeAllListeners("close");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("close")} Listener.`);
                break;
            case "RawDevicePropertyChanged":
                station.removeAllListeners("raw device property changed");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("raw device property changed")} Listener.`);
                break;
            case "LivestreamStart":
                station.removeAllListeners("livestream start");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("livestream start")} Listener.`);
                break;
            case "LivestreamStop":
                station.removeAllListeners("livestream stop");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("livestream stop")} Listener.`);
                break;
            case "LivestreamError":
                station.removeAllListeners("livestream error");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("livestream error")} Listener.`);
                break;
            case "DownloadStart":
                station.removeAllListeners("download start");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("download start")} Listener.`);
                break;
            case "DownloadFinish":
                station.removeAllListeners("download finish");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("download finish")} Listener.`);
                break;
            case "CommandResult":
                station.removeAllListeners("command result");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("command result")} Listener.`);
                break;
            case "GuardMode":
                station.removeAllListeners("guard mode");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("guard mode")} Listener.`);
                break;
            case "CurrentMode":
                station.removeAllListeners("current mode");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("current mode")} Listener.`);
                break;
            case "RTSPLivestreamStart":
                station.removeAllListeners("rtsp livestream start");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("rtsp livestream start")} Listener.`);
                break;
            case "RTSPLivestreamStop":
                station.removeAllListeners("rtsp livestream stop");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("rtsp livestream stop")} Listener.`);
                break;
            case "RTSPUrl":
                station.removeAllListeners("rtsp url");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("rtsp url")} Listener.`);
                break;
            case "PropertyChanged":
                station.removeAllListeners("property changed");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("property changed")} Listener.`);
                break;
            case "RawPropertyChanged":
                station.removeAllListeners("raw property changed");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("raw property changed")} Listener.`);
                break;
            case "AlarmEvent":
                station.removeAllListeners("alarm event");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("alarm event")} Listener.`);
                break;
            case "RuntimeState":
                station.removeAllListeners("runtime state");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("runtime state")} Listener.`);
                break;
            case "ChargingState":
                station.removeAllListeners("charging state");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("charging state")} Listener.`);
                break;
            case "WifiRssi":
                station.removeAllListeners("wifi rssi");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("wifi rssi")} Listener.`);
                break;
            case "FloodlightManualSwitch":
                station.removeAllListeners("floodlight manual switch");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("floodlight manual switch")} Listener.`);
                break;
            case "AlarmDelayEvent":
                station.removeAllListeners("alarm delay event");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("alarm delay event")} Listener.`);
                break;
            case "TalkbackStarted":
                station.removeAllListeners("talkback started");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("talkback started")} Listener.`);
                break;
            case "TalkbackStopped":
                station.removeAllListeners("talkback stopped");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("talkback stopped")} Listener.`);
                break;
            case "TalkbackError":
                station.removeAllListeners("talkback error");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("talkback error")} Listener.`);
                break;
            case "AlarmArmedEvent":
                station.removeAllListeners("alarm armed event");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("alarm armed event")} Listener.`);
                break;
            case "AlarmArmDelayEvent":
                station.removeAllListeners("alarm arm delay event");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("alarm arm delay event")} Listener.`);
                break;
            case "SecondaryCommandResult":
                station.removeAllListeners("secondary command result");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("secondary command result")} Listener.`);
                break;
            case "DeviceShakeAlarm":
                station.removeAllListeners("device shake alarm");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("device shake alarm")} Listener.`);
                break;
            case "Device911Alarm":
                station.removeAllListeners("device 911 alarm");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("device 911 alarm")} Listener.`);
                break;
            case "DeviceJammed":
                station.removeAllListeners("device jammed");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("device jammed")} Listener.`);
                break;
            case "DeviceLowBattery":
                station.removeAllListeners("device low battery");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("device low battery")} Listener.`);
                break;
            case "DeviceWrongTryProtectAlarm":
                station.removeAllListeners("device wrong try-protect alarm");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("device wrong try-protect alarm")} Listener.`);
                break;
            case "DevicePinVerified":
                station.removeAllListeners("device pin verified");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("device pin verified")} Listener.`);
                break;
            case "SdInfoEx":
                station.removeAllListeners("sd info ex");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("sd info ex")} Listener.`);
                break;
            case "ImageDownload":
                station.removeAllListeners("image download");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("image download")} Listener.`);
                break;
            case "DatabaseQueryLocal":
                station.removeAllListeners("database query local");
                this.api.logDebug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("database query local")} Listener.`);
                break;
            default:
                this.api.logInfo(`The listener '${eventListenerName}' for station ${station.getSerial()} is unknown.`);
        }
    }
    /**
     * Returns the number of attached listeners for a given station and a given event.
     * @param station The station the number of attached listners to count.
     * @param eventListenerName The name of the event the attached listeners to count.
     */
    countEventListener(station, eventListenerName) {
        switch (eventListenerName) {
            case "Connect":
                return station.listenerCount("connect");
            case "ConnectionError":
                return station.listenerCount("connection error");
            case "Close":
                return station.listenerCount("close");
            case "RawDevicePropertyChanged":
                return station.listenerCount("raw device property changed");
            case "LivestreamStart":
                return station.listenerCount("livestream start");
            case "LivestreamStop":
                return station.listenerCount("livestream stop");
            case "LivestreamError":
                return station.listenerCount("livestream error");
            case "DownloadStart":
                return station.listenerCount("download start");
            case "DownloadFinish":
                return station.listenerCount("download finish");
            case "CommandResult":
                return station.listenerCount("command result");
            case "GuardMode":
                return station.listenerCount("guard mode");
            case "CurrentMode":
                return station.listenerCount("current mode");
            case "RTSPLivestreamStart":
                return station.listenerCount("rtsp livestream start");
            case "RTSPLivestreamStop":
                return station.listenerCount("rtsp livestream stop");
            case "RTSPUrl":
                return station.listenerCount("rtsp url");
            case "PropertyChanged":
                return station.listenerCount("property changed");
            case "RawPropertyChanged":
                return station.listenerCount("raw property changed");
            case "AlarmEvent":
                return station.listenerCount("alarm event");
            case "RuntimeState":
                return station.listenerCount("runtime state");
            case "ChargingState":
                return station.listenerCount("charging state");
            case "WifiRssi":
                return station.listenerCount("wifi rssi");
            case "FloodlightManualSwitch":
                return station.listenerCount("floodlight manual switch");
            case "AlarmDelayEvent":
                return station.listenerCount("alarm delay event");
            case "TalkbackStarted":
                return station.listenerCount("talkback started");
            case "TalkbackStopped":
                return station.listenerCount("talkback stopped");
            case "TalkbackError":
                return station.listenerCount("talkback error");
            case "AlarmArmedEvent":
                return station.listenerCount("alarm armed event");
            case "AlarmArmDelayEvent":
                return station.listenerCount("alarm arm delay event");
            case "SecondaryCommandResult":
                return station.listenerCount("secondary command result");
            case "DeviceShakeAlarm":
                return station.listenerCount("device shake alarm");
            case "Device911Alarm":
                return station.listenerCount("device 911 alarm");
            case "DeviceJammed":
                return station.listenerCount("device jammed");
            case "DeviceLowBattery":
                return station.listenerCount("device low battery");
            case "DeviceWrongTryProtectAlarm":
                return station.listenerCount("device wrong try-protect alarm");
            case "DevicePinVerified":
                return station.listenerCount("device pin verified");
            case "SdInfoEx":
                return station.listenerCount("sd info ex");
            case "ImageDownload":
                return station.listenerCount("image download");
            case "DatabaseQueryLocal":
                return station.listenerCount("database query local");
        }
        return -1;
    }
    /**
     * The action to be done when event Connect is fired.
     * @param station The station as Station object.
     */
    async onStationConnect(station) {
        this.api.logDebug(`Event "Connect": station: ${station.getSerial()}`);
        this.emit("station connect", station);
        if ((http_1.Device.isCamera(station.getDeviceType()) && !http_1.Device.isWiredDoorbell(station.getDeviceType()) || http_1.Device.isSmartSafe(station.getDeviceType()))) {
            station.getCameraInfo().catch(error => {
                this.api.logError(`Error during station ${station.getSerial()} p2p data refreshing`, error);
            });
            if (this.refreshEufySecurityP2PTimeout[station.getSerial()] !== undefined) {
                clearTimeout(this.refreshEufySecurityP2PTimeout[station.getSerial()]);
                delete this.refreshEufySecurityP2PTimeout[station.getSerial()];
            }
            if (!station.isEnergySavingDevice()) {
                this.refreshEufySecurityP2PTimeout[station.getSerial()] = setTimeout(() => {
                    station.getCameraInfo().catch(error => {
                        this.api.logError(`Error during station ${station.getSerial()} p2p data refreshing`, error);
                    });
                }, this.P2P_REFRESH_INTERVAL_MIN * 60 * 1000);
            }
        }
    }
    /**
     * The action to be done when event Connection Error is fired.
     * @param station The station as Station object.
     * @param error Ther error occured.
     */
    onStationConnectionError(station, error) {
        this.api.logDebug(`Event "ConnectionError": station: ${station.getSerial()}`);
        this.emit("station connection error", station, error);
    }
    /**
     * The action to be done when event Close is fired.
     * @param station The station as Station object.
     */
    async onStationClose(station) {
        this.api.logInfo(`Event "Close": station: ${station.getSerial()}`);
        this.emit("station close", station);
        if (this.api.getServiceState() != "shutdown") {
        }
        for (const device_sn of this.cameraStationLivestreamTimeout.keys()) {
            this.api.getDevice(device_sn).then((device) => {
                if (device !== null && device.getStationSerial() === station.getSerial()) {
                    clearTimeout(this.cameraStationLivestreamTimeout.get(device_sn));
                    this.cameraStationLivestreamTimeout.delete(device_sn);
                }
            }).catch((error) => {
                this.api.logError(`Station ${station.getSerial()} - Error:`, error);
            });
        }
    }
    /**
     * The action to be done when event RawDevicePropertyChanged is fired.
     * @param deviceSerial The serial of the device the raw values changed for.
     * @param values The raw values for the device.
     */
    async onStationRawDevicePropertyChanged(deviceSerial, values) {
        this.api.logDebug(`Event "RawDevicePropertyChanged": device: ${deviceSerial} | values: ${values}`);
        this.api.updateDeviceProperties(deviceSerial, values);
    }
    /**
     * The action to be done when event LivestreamStart is fired.
     * @param station The station as Station object.
     * @param channel The channel to define the device.
     * @param metadata The metadata.
     * @param videoStream The videoStream.
     * @param audioStream  The audioStream.
     */
    async onStationLivestreamStart(station, channel, metadata, videoStream, audioStream) {
        this.api.logDebug(`Event "LivestreamStart": station: ${station.getSerial()} | channel: ${channel}`);
        this.api.getDeviceByStationAndChannel(station.getSerial(), channel).then((device) => {
            this.emit("station livestream start", station, device, metadata, videoStream, audioStream);
        }).catch((error) => {
            this.api.logError(`Station start livestream error (station: ${station.getSerial()} channel: ${channel})`, error);
        });
    }
    /**
     * The action to be done when event LivestreamStop is fired.
     * @param station The station as Station object.
     * @param channel The channel to define the device.
     */
    async onStationLivestreamStop(station, channel) {
        this.api.logDebug(`Event "LivestreamStop": station: ${station.getSerial()} | channel: ${channel}`);
        this.api.getDeviceByStationAndChannel(station.getSerial(), channel).then((device) => {
            this.emit("station livestream stop", station, device);
        }).catch((error) => {
            this.api.logError(`Station stop livestream error (station: ${station.getSerial()} channel: ${channel})`, error);
        });
    }
    /**
     * The action to be done when event LivestreamError is fired.
     * @param station The station as Station object.
     * @param channel The channel to define the device.
     */
    async onStationLivestreamError(station, channel) {
        this.api.logDebug(`Event "LivestreamError": station: ${station.getSerial()} | channel: ${channel}`);
        this.api.getDeviceByStationAndChannel(station.getSerial(), channel).then((device) => {
            station.stopLivestream(device);
        }).catch((error) => {
            this.api.logError(`Station livestream error (station: ${station.getSerial()} channel: ${channel} error: ${error}})`, error);
        });
    }
    /**
     * The action to be done when event DownloadStart is fired.
     * @param station The station as Station object.
     * @param channel The channel to define the device.
     * @param metadata The metadata.
     * @param videoStream The videoStream.
     * @param audioStream  The audioStream.
     */
    async onStationDownloadStart(station, channel, metadata, videoStream, audioStream) {
        this.api.logDebug(`Event "DownloadStart": station: ${station.getSerial()} | channel: ${channel}`);
        this.api.getDeviceByStationAndChannel(station.getSerial(), channel).then((device) => {
            this.emit("station download start", station, device, metadata, videoStream, audioStream);
        }).catch((error) => {
            this.api.logError(`Station start download error (station: ${station.getSerial()} channel: ${channel})`, error);
        });
    }
    /**
     * The action to be done when event DownloadFinish is fired.
     * @param station The station as Station object.
     * @param channel The channel to define the device.
     */
    async onStationDownloadFinish(station, channel) {
        this.api.logDebug(`Event "DownloadFinish": station: ${station.getSerial()} | channel: ${channel}`);
        this.api.getDeviceByStationAndChannel(station.getSerial(), channel).then((device) => {
            this.emit("station download finish", station, device);
        }).catch((error) => {
            this.api.logError(`Station finish download error (station: ${station.getSerial()} channel: ${channel})`, error);
        });
    }
    /**
     * The action to be done when event StationCommandResult is fired.
     * @param station The station as Station object.
     * @param result The result.
     */
    onStationCommandResult(station, result) {
        this.emit("station command result", station, result);
        if (result.return_code === 0) {
            this.api.getDeviceByStationAndChannel(station.getSerial(), result.channel).then((device) => {
                if ((result.customData !== undefined && result.customData.property !== undefined && !device.isLockWifiR10() && !device.isLockWifiR20() && !device.isLockWifiVideo() && !device.isSmartSafe()) ||
                    (result.customData !== undefined && result.customData.property !== undefined && device.isSmartSafe() && result.command_type !== p2p_1.CommandType.CMD_SMARTSAFE_SETTINGS)) {
                    if (device.hasProperty(result.customData.property.name)) {
                        device.updateProperty(result.customData.property.name, result.customData.property.value);
                    }
                    else if (station.hasProperty(result.customData.property.name)) {
                        station.updateProperty(result.customData.property.name, result.customData.property.value);
                    }
                }
                else if (result.customData !== undefined && result.customData.command !== undefined && result.customData.command.name === http_1.CommandName.DeviceSnooze) {
                    const snoozeTime = result.customData.command.value !== undefined && result.customData.command.value.snooze_time !== undefined ? result.customData.command.value.snooze_time : 0;
                    if (snoozeTime > 0) {
                        device.updateProperty(http_1.PropertyName.DeviceSnooze, true);
                        device.updateProperty(http_1.PropertyName.DeviceSnoozeTime, snoozeTime);
                    }
                    this.httpService.refreshAllData().then(() => {
                        const snoozeStartTime = device.getPropertyValue(http_1.PropertyName.DeviceSnoozeStartTime);
                        const currentTime = Math.trunc(new Date().getTime() / 1000);
                        let timeoutMS;
                        if (snoozeStartTime !== undefined && snoozeStartTime !== 0) {
                            timeoutMS = (snoozeStartTime + snoozeTime - currentTime) * 1000;
                        }
                        else {
                            timeoutMS = snoozeTime * 1000;
                        }
                        this.api.setDeviceSnooze(device, timeoutMS);
                    }).catch(error => {
                        this.api.logError("Error during API data refreshing", error);
                    });
                }
            }).catch((error) => {
                if (error instanceof error_1.DeviceNotFoundError) {
                    if (result.customData !== undefined && result.customData.property !== undefined) {
                        station.updateProperty(result.customData.property.name, result.customData.property.value);
                    }
                }
                else {
                    this.api.logError(`Station command result error (station: ${station.getSerial()})`, error);
                }
            });
            if (station.isIntegratedDevice() && result.command_type === p2p_1.CommandType.CMD_SET_ARMING && station.isConnected() && station.getDeviceType() !== http_1.DeviceType.DOORBELL) {
                station.getCameraInfo();
            }
        }
        if (result.customData !== undefined && result.customData.command !== undefined) {
            const customValue = result.customData.command.value;
            switch (result.customData.command.name) {
                case http_1.CommandName.DeviceAddUser:
                    this.api.getDeviceByStationAndChannel(station.getSerial(), result.channel).then((device) => {
                        switch (result.return_code) {
                            case 0:
                                this.emit("user added", device, customValue.username, customValue.schedule);
                                break;
                            case 4:
                                this.emit("user error", device, customValue.username, new error_1.AddUserError("Passcode already used by another user, please choose a different one"));
                                break;
                            default:
                                this.emit("user error", device, customValue.username, new error_1.AddUserError(`Error creating user with return code ${result.return_code}`));
                                break;
                        }
                    });
                    break;
                case http_1.CommandName.DeviceDeleteUser:
                    this.api.getDeviceByStationAndChannel(station.getSerial(), result.channel).then((device) => {
                        switch (result.return_code) {
                            case 0:
                                this.httpService.deleteUser(device.getSerial(), customValue.short_user_id, device.getStationSerial()).then((result) => {
                                    if (result) {
                                        this.emit("user deleted", device, customValue.username);
                                    }
                                    else {
                                        this.emit("user error", device, customValue.username, new error_1.DeleteUserError(`Error in deleting user "${customValue.username}" with id "${customValue.short_user_id}" through cloud api call`));
                                    }
                                });
                                break;
                            default:
                                this.emit("user error", device, customValue.username, new Error(`Error deleting user with return code ${result.return_code}`));
                                break;
                        }
                    });
                    break;
                case http_1.CommandName.DeviceUpdateUserPasscode:
                    this.api.getDeviceByStationAndChannel(station.getSerial(), result.channel).then((device) => {
                        switch (result.return_code) {
                            case 0:
                                this.emit("user passcode updated", device, customValue.username);
                                break;
                            default:
                                this.emit("user error", device, customValue.username, new error_1.UpdateUserPasscodeError(`Error updating user passcode with return code ${result.return_code}`));
                                break;
                        }
                    });
                    break;
                case http_1.CommandName.DeviceUpdateUserSchedule:
                    this.api.getDeviceByStationAndChannel(station.getSerial(), result.channel).then((device) => {
                        switch (result.return_code) {
                            case 0:
                                this.emit("user schedule updated", device, customValue.username, customValue.schedule);
                                break;
                            default:
                                this.emit("user error", device, customValue.username, new error_1.UpdateUserScheduleError(`Error updating user schedule with return code ${result.return_code}`));
                                break;
                        }
                    });
                    break;
            }
        }
    }
    /**
     * The action to be done when event SecondaryCommandResult is fired.
     * @param station The station as Station object.
     * @param result The result.
     */
    onStationSecondaryCommandResult(station, result) {
        this.api.logDebug(`Event "SecondaryCommandResult": station: ${station.getSerial()} | result: ${result}`);
        if (result.return_code === 0) {
            this.api.getDeviceByStationAndChannel(station.getSerial(), result.channel).then((device) => {
                if (result.customData !== undefined && result.customData.property !== undefined) {
                    if (device.hasProperty(result.customData.property.name)) {
                        device.updateProperty(result.customData.property.name, result.customData.property.value);
                    }
                    else if (station.hasProperty(result.customData.property.name)) {
                        station.updateProperty(result.customData.property.name, result.customData.property.value);
                    }
                }
            }).catch((error) => {
                if (error instanceof error_1.DeviceNotFoundError) {
                    if (result.customData !== undefined && result.customData.property !== undefined) {
                        station.updateProperty(result.customData.property.name, result.customData.property.value);
                    }
                }
                else {
                    this.api.logError(`Station secondary command result error (station: ${station.getSerial()})`, error);
                }
            });
        }
    }
    /**
     * The action to be done when event GuardMode is fired.
     * @param station The station as Station object.
     * @param guardMode The new guard mode as GuardMode.
     */
    async onStationGuardMode(station, guardMode) {
        this.setLastGuardModeChangeTimeNow(station.getSerial());
        this.api.updateStationGuardModeSystemVariable(station.getSerial(), guardMode);
        if (this.skipNextModeChangeEvent[station.getSerial()] == true) {
            this.api.logDebug("Event skipped due to locally forced changeGuardMode.");
            this.skipNextModeChangeEvent[station.getSerial()] = false;
        }
        else {
            this.api.logDebug(`Event "GuardMode": station: ${station.getSerial()} | guard mode: ${guardMode}`);
            await this.api.updateGuardModeStation(station.getSerial());
        }
    }
    /**
     * The action to be done when event CurrentMode is fired.
     * @param station The station as Station object.
     * @param guardMode The new guard mode as GuardMode.
     */
    async onStationCurrentMode(station, guardMode) {
        if (this.skipNextModeChangeEvent[station.getSerial()] == true) {
            this.api.logDebug("Event skipped due to locally forced changeCurrentMode.");
            this.skipNextModeChangeEvent[station.getSerial()] = false;
        }
        else {
            this.api.logDebug(`Event "CurrentMode": station: ${station.getSerial()} | guard mode: ${guardMode}`);
            await this.api.updateGuardModeStation(station.getSerial());
        }
    }
    /**
     * The action to be done when event RTSPLivestreamStart is fired.
     * @param station The station as Station object.
     * @param channel The channel to define the device.
     */
    async onStationRTSPLivestreamStart(station, channel) {
        this.api.logDebug(`Event "RTSPLivestreamStart": station: ${station.getSerial()} | channel: ${channel}`);
        this.api.getDeviceByStationAndChannel(station.getSerial(), channel).then((device) => {
            this.emit("station rtsp livestream start", station, device);
        }).catch((error) => {
            this.api.logError(`Station start rtsp livestream error (station: ${station.getSerial()} channel: ${channel})`, error);
        });
    }
    /**
     * The action to be done when event RTSPLivestreamStop is fired.
     * @param station The station as Station object.
     * @param channel The channel to define the device.
     */
    async onStationRTSPLivestreamStop(station, channel) {
        this.api.logDebug(`Event "RTSPLivestreamStop": station: ${station.getSerial()} | channel: ${channel}`);
        this.api.getDeviceByStationAndChannel(station.getSerial(), channel).then((device) => {
            this.emit("station rtsp livestream stop", station, device);
        }).catch((error) => {
            this.api.logError(`Station stop rtsp livestream error (station: ${station.getSerial()} channel: ${channel})`, error);
        });
    }
    /**
     * The action to be done when event RTSPURL is fired.
     * @param station The station as Station object.
     * @param channel The channel to define the device.
     */
    async onStationRTSPURL(station, channel, value) {
        this.api.logDebug(`Event "RTSPURL": station: ${station.getSerial()} | channel: ${channel}`);
        this.api.getDeviceByStationAndChannel(station.getSerial(), channel).then((device) => {
            this.emit("station rtsp url", station, device, value);
            device.setCustomPropertyValue(http_1.PropertyName.DeviceRTSPStreamUrl, value);
        }).catch((error) => {
            this.api.logError(`Station rtsp url error (station: ${station.getSerial()} channel: ${channel})`, error);
        });
    }
    /**
     * The action to be done when event PropertyChanged is fired.
     * @param station The station as Station object.
     * @param name The name of the changed value.
     * @param value The value and timestamp of the new value as PropertyValue.
     */
    async onStationPropertyChanged(station, name, value, ready) {
        if (ready && (!name.startsWith("hidden-") && name != "guardMode" && name != "currentMode")) {
            this.api.logDebug(`Event "PropertyChanged": station: ${station.getSerial()} | name: ${name} | value: ${value}`);
        }
    }
    /**
     * The action to be done when event RawPropertyChanged is fired.
     * @param station The station as Station object.
     * @param type The number of the raw-value in the eufy ecosystem.
     * @param value The new value as string.
     */
    async onStationRawPropertyChanged(station, type, value) {
        if (type != 1102 && type != 1137 && type != 1147 && type != 1151 && type != 1154 && type != 1162 && type != 1165 && type != 1224 && type != 1279 && type != 1281 && type != 1282 && type != 1283 && type != 1284 && type != 1285 && type != 1660 && type != 1664 && type != 1665) {
            this.api.logDebug(`Event "RawPropertyChanged": station: ${station.getSerial()} | type: ${type} | value: ${value}`);
        }
    }
    /**
     * The action to be done when event AlarmEvent is fired.
     * @param station The station as Station object.
     * @param alarmEvent The alarmEvent.
     */
    async onStationAlarmEvent(station, alarmEvent) {
        this.api.logDebug(`Event "AlarmEvent": station: ${station.getSerial()} | alarmEvent: ${alarmEvent}`);
    }
    /**
     * The action to be done when event StationRuntimeState is fired.
     * @param station The station as Station object.
     * @param channel The channel to define the device.
     * @param batteryLevel The battery level as percentage value.
     * @param temperature The temperature as degree value.
     */
    async onStationRuntimeState(station, channel, batteryLevel, temperature) {
        this.api.logDebug(`Event "RuntimeState": station: ${station.getSerial()} | channel: ${channel} | battery: ${batteryLevel} | temperature: ${temperature}`);
        this.api.getDeviceByStationAndChannel(station.getSerial(), channel).then((device) => {
            if (device.hasProperty(http_1.PropertyName.DeviceBattery)) {
                const metadataBattery = device.getPropertyMetadata(http_1.PropertyName.DeviceBattery);
                device.updateRawProperty(metadataBattery.key, batteryLevel.toString());
            }
            if (device.hasProperty(http_1.PropertyName.DeviceBatteryTemp)) {
                const metadataBatteryTemperature = device.getPropertyMetadata(http_1.PropertyName.DeviceBatteryTemp);
                device.updateRawProperty(metadataBatteryTemperature.key, temperature.toString());
            }
        }).catch((error) => {
            this.api.logError(`Station runtime state error (station: ${station.getSerial()} channel: ${channel})`, error);
        });
    }
    /**
     * The action to be done when event StationChargingState is fired.
     * @param station The station as Station object.
     * @param channel The channel to define the device.
     * @param chargeType The current carge state.
     * @param batteryLevel The battery level as percentage value.
     */
    async onStationChargingState(station, channel, chargeType, batteryLevel) {
        this.api.logDebug(`Event "ChargingState": station: ${station.getSerial()} | channel: ${channel} | battery: ${batteryLevel} | type: ${chargeType}`);
        this.api.getDeviceByStationAndChannel(station.getSerial(), channel).then((device) => {
            if (device.hasProperty(http_1.PropertyName.DeviceBattery)) {
                const metadataBattery = device.getPropertyMetadata(http_1.PropertyName.DeviceBattery);
                if (chargeType !== p2p_1.ChargingType.PLUGGED && batteryLevel > 0)
                    device.updateRawProperty(metadataBattery.key, batteryLevel.toString());
            }
            if (device.hasProperty(http_1.PropertyName.DeviceChargingStatus)) {
                const metadataChargingStatus = device.getPropertyMetadata(http_1.PropertyName.DeviceChargingStatus);
                device.updateRawProperty(metadataChargingStatus.key, chargeType.toString());
            }
        }).catch((error) => {
            this.api.logError(`Station charging state error (station: ${station.getSerial()} channel: ${channel})`, error);
        });
    }
    /**
     * The action to be done when event StationWifiRssi is fired.
     * @param station The station as Station object.
     * @param channel The channel to define the device.
     * @param rssi The current rssi value.
     */
    async onStationWifiRssi(station, channel, rssi) {
        this.api.logDebug(`Event "WifiRssi": station: ${station.getSerial()} | channel: ${channel} | rssi: ${rssi}`);
        this.api.getDeviceByStationAndChannel(station.getSerial(), channel).then((device) => {
            if (device.hasProperty(http_1.PropertyName.DeviceWifiRSSI)) {
                const metadataWifiRssi = device.getPropertyMetadata(http_1.PropertyName.DeviceWifiRSSI);
                device.updateRawProperty(metadataWifiRssi.key, rssi.toString());
            }
        }).catch((error) => {
            this.api.logError(`Station wifi rssi error (station: ${station.getSerial()} channel: ${channel})`, error);
        });
    }
    /**
     * The action to be done when event FloodlightManualSwitch is fired.
     * @param station The station as Station object.
     * @param channel The channel to define the device.
     * @param enabled The value for the floodlight.
     */
    async onStationFloodlightManualSwitch(station, channel, enabled) {
        this.api.logDebug(`Event "FloodlightManualSwitch": station: ${station.getSerial()} | channel: ${channel} | enabled: ${enabled}`);
        this.api.getDeviceByStationAndChannel(station.getSerial(), channel).then((device) => {
            if (device.hasProperty(http_1.PropertyName.DeviceLight)) {
                const metadataLight = device.getPropertyMetadata(http_1.PropertyName.DeviceLight);
                device.updateRawProperty(metadataLight.key, enabled === true ? "1" : "0");
            }
        }).catch((error) => {
            this.api.logError(`Station floodlight manual switch error (station: ${station.getSerial()} channel: ${channel})`, error);
        });
    }
    /**
     * The action to be done when event AlarmDelayEvent is fired.
     * @param station The station as Station object.
     * @param alarmDelayEvent The AlarmDelayedEvent.
     * @param alarmDelay The delay in ms.
     */
    async onStationAlarmDelayEvent(station, alarmDelayEvent, alarmDelay) {
        this.api.logDebug(`Event "AlarmDelayEvent": station: ${station.getSerial()} | alarmDeleayEvent: ${alarmDelayEvent} | alarmDeleay: ${alarmDelay}`);
    }
    /**
     * The action to be done when event TalkbackStarted is fired.
     * @param station The station as Station object.
     * @param channel The channel to define the device.
     * @param talkbackStream The TalbackStream object.
     */
    async onStationTalkbackStarted(station, channel, talkbackStream) {
        this.api.logDebug(`Event "TalkbackStarted": station: ${station.getSerial()} | channel: ${channel} | talkbackStream: ${talkbackStream}`);
        this.api.getDeviceByStationAndChannel(station.getSerial(), channel).then((device) => {
            this.emit("station talkback start", station, device, talkbackStream);
        }).catch((error) => {
            this.api.logError(`Station talkback start error (station: ${station.getSerial()} channel: ${channel})`, error);
        });
    }
    /**
     * The action to be done when event TalkbackStopped is fired.
     * @param station The station as Station object.
     * @param channel The channel to define the device.
     */
    async onStationTalkbackStopped(station, channel) {
        this.api.logDebug(`Event "TalkbackStopped": station: ${station.getSerial()} | channel: ${channel}`);
        this.api.getDeviceByStationAndChannel(station.getSerial(), channel).then((device) => {
            this.emit("station talkback stop", station, device);
        }).catch((error) => {
            this.api.logError(`Station talkback stop error (station: ${station.getSerial()} channel: ${channel})`, error);
        });
    }
    /**
     * The action to be done when event TalkbackError is fired.
     * @param station The station as Station object.
     * @param channel The channel to define the device.
     * @param error The error object.
     */
    async onStationTalkbackError(station, channel, error) {
        this.api.logDebug(`Event "TalkbackError": station: ${station.getSerial()} | channel: ${channel} | error: ${error}`);
        this.api.getDeviceByStationAndChannel(station.getSerial(), channel).then((device) => {
            station.stopTalkback(device);
        }).catch((error) => {
            this.api.logError(`Station talkback error (station: ${station.getSerial()} channel: ${channel} error: ${error}})`, error);
        });
    }
    /**
     * The action to be done when event AlarmArmedEvent is fired.
     * @param station The station as Station object.
     */
    async onStationAlarmArmedEvent(station) {
        this.api.logDebug(`Event "AlarmArmedEvent": station: ${station.getSerial()}`);
    }
    /**
     * The action to be done when event AlarmArmDelayEvent is fired.
     * @param station The station as Station object.
     * @param alarmDelay The delay in ms.
     */
    async onStationArmDelayEvent(station, alarmDelay) {
        this.api.logDebug(`Event "ArmDelayEvent": station: ${station.getSerial()} | alarmDelay: ${alarmDelay}`);
    }
    /**
     * The action to be done when event DeviceShakeAlarm is fired.
     * @param deviceSerial The device serial.
     * @param event The SmartSafeShakeAlarmEvent event.
     */
    onStationDeviceShakeAlarm(deviceSerial, event) {
        this.api.logDebug(`Event "DeviceShakeAlarm": device: ${deviceSerial} | event: ${event}`);
        this.api.getDevice(deviceSerial).then((device) => {
            if (device.isSmartSafe())
                device.shakeEvent(event, this.api.getEventDurationSeconds());
        }).catch((error) => {
            this.api.logError(`onStationShakeAlarm device ${deviceSerial} error`, error);
        });
    }
    /**
     * The action to be done when event Device911Alarm is fired.
     * @param deviceSerial The device serial.
     * @param event The SmartSafeAlarm911Event event.
     */
    onStationDevice911Alarm(deviceSerial, event) {
        this.api.logDebug(`Event "Device911Alarm": device: ${deviceSerial} | event: ${event}`);
        this.api.getDevice(deviceSerial).then((device) => {
            if (device.isSmartSafe())
                device.alarm911Event(event, this.api.getEventDurationSeconds());
        }).catch((error) => {
            this.api.logError(`onStation911Alarm device ${deviceSerial} error`, error);
        });
    }
    /**
     * The action to be done when event DeviceJammed is fired.
     * @param deviceSerial The device serial.
     */
    onStationDeviceJammed(deviceSerial) {
        this.api.logDebug(`Event "DeviceJammed": device: ${deviceSerial}`);
        this.api.getDevice(deviceSerial).then((device) => {
            if (device.isSmartSafe())
                device.jammedEvent(this.api.getEventDurationSeconds());
        }).catch((error) => {
            this.api.logError(`onStationDeviceJammed device ${deviceSerial} error`, error);
        });
    }
    /**
     * The action to be done when event DeviceLowBattery is fired.
     * @param deviceSerial The device serial.
     */
    onStationDeviceLowBattery(deviceSerial) {
        this.api.logInfo(`Event "DeviceLowBattery": device: ${deviceSerial}`);
        this.api.getDevice(deviceSerial).then((device) => {
            if (device.isSmartSafe())
                device.lowBatteryEvent(this.api.getEventDurationSeconds());
        }).catch((error) => {
            this.api.logError(`onStationDeviceLowBattery device ${deviceSerial} error`, error);
        });
    }
    /**
     * The action to be done when event DeviceWrongTryProtectAlarm is fired.
     * @param deviceSerial The device serial.
     */
    onStationDeviceWrongTryProtectAlarm(deviceSerial) {
        this.api.logDebug(`Event "DeviceWrongTryProtectAlarm": device: ${deviceSerial}`);
        this.api.getDevice(deviceSerial).then((device) => {
            if (device.isSmartSafe())
                device.wrongTryProtectAlarmEvent(this.api.getEventDurationSeconds());
        }).catch((error) => {
            this.api.logError(`onStationDeviceWrongTryProtectAlarm device ${deviceSerial} error`, error);
        });
    }
    /**
     * The action to be performed when event pin verfifcation is fired.
     * @param deviceSerial The device serial.
     * @param successfull Result of pin verification.
     */
    onStationDevicePinVerified(deviceSerial, successfull) {
        this.api.logDebug(`Event "DeviceWrongTryProtectAlarm": device: ${deviceSerial}`);
        this.api.getDevice(deviceSerial).then((device) => {
            this.emit("device pin verified", device, successfull);
        }).catch((error) => {
            this.api.logError(`onStationDevicePinVerified device ${deviceSerial} error`, error);
        });
    }
    /**
     * The action to be performed when event sd info ex is fired.
     * @param station The station as Station object.
     * @param sdCapacity The capacity of the sd card.
     * @param sdCapacityAvailable The available capacity of the sd card.
     */
    onStationSdInfoEx(station, sdStatus, sdCapacity, sdCapacityAvailable) {
        if (station.hasProperty(http_1.PropertyName.StationSdStatus)) {
            station.updateProperty(http_1.PropertyName.StationSdStatus, sdStatus);
        }
        if (station.hasProperty(http_1.PropertyName.StationSdCapacity)) {
            station.updateProperty(http_1.PropertyName.StationSdCapacity, sdCapacity);
        }
        if (station.hasProperty(http_1.PropertyName.StationSdCapacityAvailable)) {
            station.updateProperty(http_1.PropertyName.StationSdCapacityAvailable, sdCapacityAvailable);
        }
    }
    /**
     * The action to be performed when event station image download is fired.
     * @param station The station as Station object.
     * @param file The file name.
     * @param image The image.
     */
    onStationImageDownload(station, file, image) {
        const type = (0, image_type_1.default)(image);
        const picture = {
            data: image,
            type: type !== null ? type : { ext: "unknown", mime: "application/octet-stream" }
        };
        this.emit("station image download", station, file, picture);
        this.api.getDevicesFromStation(station.getSerial()).then((devices) => {
            var filename = path_1.default.parse(file).name;
            var channel = 0;
            if (filename.includes("_c")) {
                channel = Number.parseInt(filename.split("_c", 2)[1]);
            }
            for (const device of devices) {
                //if (device.getPropertyValue(PropertyName.DevicePictureUrl) === file && (device.getPropertyValue(PropertyName.DevicePicture) === undefined || device.getPropertyValue(PropertyName.DevicePicture) === null)) {
                if (device.getSerial() === station.getSerial() || device.getChannel() === channel) {
                    this.api.logDebug(`onStationImageDownload - Set picture for device ${device.getSerial()} file: ${file} picture_ext: ${picture.type.ext} picture_mime: ${picture.type.mime}`);
                    device.updateProperty(http_1.PropertyName.DevicePicture, picture);
                    break;
                }
            }
        }).catch((error) => {
            this.api.logError(`onStationImageDownload - Set first picture error`, error);
        });
    }
    /**
     * The action to be performed when event station database query local is fired.
     * @param station The station as Station object.
     * @param returnCode The return code of the query.
     * @param data The result data.
     */
    onStationDatabaseQueryLocal(station, returnCode, data) {
        this.emit("station database query local", station, returnCode, data);
    }
    /**
     * Set the last guard mode change time to the array.
     * @param stationSerial The serial of the station.
     * @param time The time as timestamp or undefined.
     */
    setLastGuardModeChangeTime(stationSerial, timeStamp, timeStampType) {
        if (timeStamp !== undefined) {
            timeStamp = (0, utils_3.convertTimeStampToTimeStampMs)(timeStamp, timeStampType);
        }
        this.lastGuardModeChangeTimeForStations[stationSerial] = timeStamp;
        this.api.updateStationGuardModeChangeTimeSystemVariable(stationSerial, this.lastGuardModeChangeTimeForStations[stationSerial]);
    }
    /**
     * Set the time for the last guard mode change to the current time.
     * @param stationSerial The serial of the station.
     */
    setLastGuardModeChangeTimeNow(stationSerial) {
        this.setLastGuardModeChangeTime(stationSerial, new Date().getTime(), "ms");
    }
    /**
     * Retrieve the last guard mode change time from the array.
     * @param stationSerial The serial of the station.
     * @returns The timestamp as number or undefined.
     */
    getLastGuardModeChangeTime(stationSerial) {
        return this.lastGuardModeChangeTimeForStations[stationSerial];
    }
    /**
     * Set the given property for the given station to the given value.
     * @param stationSerial The serial of the station the property is to change.
     * @param name The name of the property.
     * @param value The value of the property.
     */
    async setStationProperty(stationSerial, name, value) {
        const station = this.stations[stationSerial];
        const metadata = station.getPropertyMetadata(name);
        value = (0, utils_2.parseValue)(metadata, value);
        switch (name) {
            case http_1.PropertyName.StationGuardMode:
                await station.setGuardMode(value);
                break;
            case http_1.PropertyName.StationAlarmTone:
                await station.setStationAlarmTone(value);
                break;
            case http_1.PropertyName.StationAlarmVolume:
                await station.setStationAlarmRingtoneVolume(value);
                break;
            case http_1.PropertyName.StationPromptVolume:
                await station.setStationPromptVolume(value);
                break;
            case http_1.PropertyName.StationNotificationSwitchModeApp:
                await station.setStationNotificationSwitchMode(http_1.NotificationSwitchMode.APP, value);
                break;
            case http_1.PropertyName.StationNotificationSwitchModeGeofence:
                await station.setStationNotificationSwitchMode(http_1.NotificationSwitchMode.GEOFENCE, value);
                break;
            case http_1.PropertyName.StationNotificationSwitchModeSchedule:
                await station.setStationNotificationSwitchMode(http_1.NotificationSwitchMode.SCHEDULE, value);
                break;
            case http_1.PropertyName.StationNotificationSwitchModeKeypad:
                await station.setStationNotificationSwitchMode(http_1.NotificationSwitchMode.KEYPAD, value);
                break;
            case http_1.PropertyName.StationNotificationStartAlarmDelay:
                await station.setStationNotificationStartAlarmDelay(value);
                break;
            case http_1.PropertyName.StationTimeFormat:
                await station.setStationTimeFormat(value);
                break;
            case http_1.PropertyName.StationSwitchModeWithAccessCode:
                await station.setStationSwitchModeWithAccessCode(value);
                break;
            case http_1.PropertyName.StationAutoEndAlarm:
                await station.setStationAutoEndAlarm(value);
                break;
            case http_1.PropertyName.StationTurnOffAlarmWithButton:
                await station.setStationTurnOffAlarmWithButton(value);
                break;
            default:
                if (!Object.values(http_1.PropertyName).includes(name)) {
                    throw new error_1.ReadOnlyPropertyError(`Property ${name} is read only`);
                }
                throw new http_1.InvalidPropertyError(`Station ${stationSerial} has no writable property named ${name}`);
        }
    }
    /**
     * Add a user to a device.
     * @param deviceSN The serial of the device.
     * @param username The username.
     * @param passcode The passcode.
     * @param schedule The schedule.
     */
    async addUser(deviceSN, username, passcode, schedule) {
        const device = await this.api.getDevice(deviceSN);
        const station = await this.getStation(device.getStationSerial());
        try {
            if (!device.hasCommand(http_1.CommandName.DeviceAddUser)) {
                throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
            }
            const addUserResponse = await this.httpService.addUser(deviceSN, username, device.getStationSerial());
            if (addUserResponse !== null) {
                await station.addUser(device, username, addUserResponse.short_user_id, passcode, schedule);
            }
            else {
                this.emit("user error", device, username, new error_1.AddUserError("Error on creating user through cloud api call"));
            }
        }
        catch (error) {
            this.api.logError(`addUser device ${deviceSN} error`, error);
            this.emit("user error", device, username, new error_1.AddUserError(`Got exception: ${error}`));
        }
    }
    /**
     * Remove a user to a device.
     * @param deviceSN The serial of the device.
     * @param username The username.
     */
    async deleteUser(deviceSN, username) {
        const device = await this.api.getDevice(deviceSN);
        const station = await this.getStation(device.getStationSerial());
        if (!device.hasCommand(http_1.CommandName.DeviceDeleteUser)) {
            throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
        }
        try {
            const users = await this.httpService.getUsers(deviceSN, device.getStationSerial());
            if (users !== null) {
                let found = false;
                for (const user of users) {
                    if (user.user_name === username) {
                        await station.deleteUser(device, user.user_name, user.short_user_id);
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    this.emit("user error", device, username, new error_1.DeleteUserError(`User with username "${username}" not found`));
                }
            }
            else {
                this.emit("user error", device, username, new error_1.DeleteUserError("Error on getting user list through cloud api call"));
            }
        }
        catch (error) {
            this.api.logError(`deleteUser device ${deviceSN} error`, error);
            this.emit("user error", device, username, new error_1.DeleteUserError(`Got exception: ${error}`));
        }
    }
    /**
     * Update user information for a device.
     * @param deviceSN The serial of the device.
     * @param username The current username.
     * @param newUsername The new username.
     */
    async updateUser(deviceSN, username, newUsername) {
        const device = await this.api.getDevice(deviceSN);
        if (!device.hasCommand(http_1.CommandName.DeviceUpdateUsername)) {
            throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
        }
        try {
            const users = await this.httpService.getUsers(deviceSN, device.getStationSerial());
            if (users !== null) {
                let found = false;
                for (const user of users) {
                    if (user.user_name === username) {
                        const result = await this.httpService.updateUser(deviceSN, device.getStationSerial(), user.short_user_id, newUsername);
                        if (result) {
                            this.emit("user username updated", device, username);
                        }
                        else {
                            this.emit("user error", device, username, new error_1.UpdateUserUsernameError(`Error in changing username "${username}" to "${newUsername}" through cloud api call`));
                        }
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    this.emit("user error", device, username, new error_1.UpdateUserUsernameError(`Error in changing username "${username}" to "${newUsername}" through cloud api call`));
                }
            }
            else {
                this.emit("user error", device, username, new error_1.UpdateUserUsernameError("Error on getting user list through cloud api call"));
            }
        }
        catch (error) {
            this.api.logError(`updateUser device ${deviceSN} error`, error);
            this.emit("user error", device, username, new error_1.UpdateUserUsernameError(`Got exception: ${error}`));
        }
    }
    /**
     * Update a user passcode.
     * @param deviceSN The device serial.
     * @param username The username.
     * @param passcode The new passcode.
     */
    async updateUserPasscode(deviceSN, username, passcode) {
        const device = await this.api.getDevice(deviceSN);
        const station = await this.getStation(device.getStationSerial());
        if (!device.hasCommand(http_1.CommandName.DeviceUpdateUserPasscode)) {
            throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
        }
        try {
            const users = await this.httpService.getUsers(deviceSN, device.getStationSerial());
            if (users !== null) {
                let found = false;
                for (const user of users) {
                    if (user.user_name === username) {
                        await station.updateUserPasscode(device, user.user_name, user.short_user_id, passcode);
                        found = true;
                    }
                }
                if (!found) {
                    this.emit("user error", device, username, new error_1.UpdateUserPasscodeError(`User with username "${username}" not found`));
                }
            }
            else {
                this.emit("user error", device, username, new error_1.UpdateUserPasscodeError("Error on getting user list through cloud api call"));
            }
        }
        catch (error) {
            this.api.logError(`updateUserPasscode device ${deviceSN} error`, error);
            this.emit("user error", device, username, new error_1.UpdateUserPasscodeError(`Got exception: ${error}`));
        }
    }
    /**
     * Updates users schedule.
     * @param deviceSN The device serial.
     * @param username The username.
     * @param schedule The new schedule.
     */
    async updateUserSchedule(deviceSN, username, schedule) {
        const device = await this.api.getDevice(deviceSN);
        const station = await this.getStation(device.getStationSerial());
        if (!device.hasCommand(http_1.CommandName.DeviceUpdateUserPasscode)) {
            throw new error_1.NotSupportedError(`This functionality is not implemented or supported by ${device.getSerial()}`);
        }
        try {
            const users = await this.httpService.getUsers(deviceSN, device.getStationSerial());
            if (users !== null) {
                let found = false;
                for (const user of users) {
                    if (user.user_name === username) {
                        await station.updateUserSchedule(device, user.user_name, user.short_user_id, schedule);
                        found = true;
                    }
                }
                if (!found) {
                    this.emit("user error", device, username, new error_1.UpdateUserScheduleError(`User with username "${username}" not found`));
                }
            }
            else {
                this.emit("user error", device, username, new error_1.UpdateUserScheduleError("Error on getting user list through cloud api call"));
            }
        }
        catch (error) {
            this.api.logError(`updateUserSchedule device ${deviceSN} error`, error);
            this.emit("user error", device, username, new error_1.UpdateUserScheduleError(`Got exception: ${error}`));
        }
    }
}
exports.Stations = Stations;
