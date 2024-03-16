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
const p2p_1 = require("./p2p");
const utils_2 = require("./utils");
const utils_3 = require("./utils/utils");
const path_1 = __importDefault(require("path"));
const logging_1 = require("./logging");
const utils_4 = require("./p2p/utils");
const utils_5 = require("./http/utils");
/**
 * Represents all the stations in the account.
 */
class Stations extends tiny_typed_emitter_1.TypedEmitter {
    api;
    httpService;
    stations = {};
    skipNextModeChangeEvent = {};
    lastGuardModeChangeTimeForStations = {};
    loadingEmitter = new events_1.default();
    stationsLoaded = (0, utils_2.waitForEvent)(this.loadingEmitter, "stations loaded");
    P2P_REFRESH_INTERVAL_MIN = 720;
    cameraMaxLivestreamSeconds = 30;
    cameraStationLivestreamTimeout = new Map();
    refreshEufySecurityP2PTimeout = {};
    /**
     * Create the Bases objects holding all stations in the account.
     * @param api The eufySecurityApi.
     * @param httpService The httpService.
     */
    constructor(api, httpService) {
        super();
        this.api = api;
        this.httpService = httpService;
        if (this.api.getStateUpdateEventActive() == false) {
            logging_1.rootAddonLogger.info("Retrieving last guard mode change times disabled in settings.");
        }
        this.httpService.on("hubs", (hubs) => this.handleHubs(hubs));
    }
    /**
     * Put all stations and their settings in format so that we can work with them.
     * @param hubs The object containing the stations.
     */
    async handleHubs(hubs) {
        logging_1.rootAddonLogger.debug("Got hubs", { hubs: hubs });
        const resStations = hubs;
        const stationsSerials = Object.keys(this.stations);
        const promises = [];
        const newStationsSerials = Object.keys(hubs);
        for (const stationSerial in resStations) {
            if (this.api.getHouseId() !== undefined && resStations[stationSerial].house_id !== undefined && this.api.getHouseId() !== "all" && resStations[stationSerial].house_id !== this.api.getHouseId()) {
                logging_1.rootAddonLogger.debug(`Station ${stationSerial} does not match houseId (got ${resStations[stationSerial].house_id} want ${this.api.getHouseId()}).`);
                continue;
            }
            if (this.stations[stationSerial]) {
                await this.updateStation(resStations[stationSerial]);
            }
            else {
                if (this.stationsLoaded === undefined) {
                    this.stationsLoaded = (0, utils_2.waitForEvent)(this.loadingEmitter, "stations loaded");
                }
                let udpPort = this.api.getLocalStaticUdpPortForStation(stationSerial);
                if (udpPort === null) {
                    udpPort = undefined;
                }
                const new_station = http_1.Station.getInstance(this.httpService, resStations[stationSerial], undefined, udpPort, this.api.getP2PConnectionType());
                this.skipNextModeChangeEvent[stationSerial] = false;
                this.lastGuardModeChangeTimeForStations[stationSerial] = undefined;
                promises.push(new_station.then((station) => {
                    try {
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
                        this.addEventListener(station, "DatabaseQueryLatest", false);
                        this.addEventListener(station, "DatabaseQueryLocal", false);
                        this.addEventListener(station, "DatabaseCountByDate", false);
                        this.addEventListener(station, "DatabaseDelete", false);
                        this.addEventListener(station, "SensorStatus", false);
                        this.addEventListener(station, "GarageDoorStatus", false);
                        this.addEventListener(station, "StorageInfoHb3", false);
                        this.addStation(station);
                        station.initialize();
                    }
                    catch (err) {
                        const error = (0, error_1.ensureError)(err);
                        logging_1.rootAddonLogger.error("HandleHubs Error", { error: (0, utils_2.getError)(error), stationSN: station.getSerial() });
                    }
                    return station;
                }));
            }
        }
        Promise.all(promises).then(() => {
            this.loadingEmitter.emit("stations loaded");
            this.stationsLoaded = undefined;
        });
        if (promises.length === 0) {
            this.loadingEmitter.emit("stations loaded");
            this.stationsLoaded = undefined;
        }
        for (const stationSerial of stationsSerials) {
            if (!newStationsSerials.includes(stationSerial)) {
                this.getStation(stationSerial).then((station) => {
                    this.removeStation(station);
                }).catch((err) => {
                    const error = (0, error_1.ensureError)(err);
                    logging_1.rootAddonLogger.error("Error removing station", { error: (0, utils_2.getError)(error), stationSN: stationSerial });
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
            logging_1.rootAddonLogger.debug(`Station with this serial ${station.getSerial()} exists already and couldn't be added again!`);
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
            logging_1.rootAddonLogger.debug(`Station with this serial ${station.getSerial()} doesn't exists and couldn't be removed!`);
        }
    }
    /**
     * Update the station information.
     * @param hub The object containg the specific hub.
     */
    async updateStation(hub) {
        if (this.stationsLoaded) {
            await this.stationsLoaded;
        }
        if (Object.keys(this.stations).includes(hub.station_sn)) {
            this.stations[hub.station_sn].update(hub);
            if (!this.stations[hub.station_sn].isConnected() && !this.stations[hub.station_sn].isEnergySavingDevice() && this.stations[hub.station_sn].isP2PConnectableDevice()) {
                this.stations[hub.station_sn].setConnectionType(this.api.getP2PConnectionType());
                this.stations[hub.station_sn].connect();
            }
            this.getStorageInfo(hub.station_sn);
        }
        else {
            logging_1.rootAddonLogger.error(`Station with this serial ${hub.station_sn} doesn't exists and couldn't be updated!`);
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
        await this.closeP2PConnections();
    }
    /**
     * Close all P2P connection for all stations.
     */
    async closeP2PConnections() {
        if (this.stations != null) {
            for (const stationSerial in this.stations) {
                if (this.stations[stationSerial]) {
                    await this.waitForP2PCloseEvent(this.stations[stationSerial], 10000).then(() => {
                        return;
                    }, () => {
                        logging_1.rootAddonLogger.error(`Could not close P2P connection to station ${stationSerial}.`);
                        return;
                    });
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
                    this.removeEventListener(this.stations[stationSerial], "DatabaseQueryLatest");
                    this.removeEventListener(this.stations[stationSerial], "DatabaseQueryLocal");
                    this.removeEventListener(this.stations[stationSerial], "DatabaseCountByDate");
                    this.removeEventListener(this.stations[stationSerial], "DatabaseDelete");
                    this.removeEventListener(this.stations[stationSerial], "SensorStatus");
                    this.removeEventListener(this.stations[stationSerial], "GarageDoorStatus");
                    this.removeEventListener(this.stations[stationSerial], "StorageInfoHb3");
                    clearTimeout(this.refreshEufySecurityP2PTimeout[stationSerial]);
                    delete this.refreshEufySecurityP2PTimeout[stationSerial];
                }
            }
        }
    }
    /**
     * Wait for the P2P closed event.
     * @param station The station for waiting for the GuardMode event.
     * @param timeout The timespan in ms maximal to wait for the event.
     * @returns Returns true or false.
     */
    async waitForP2PCloseEvent(station, timeout) {
        return new Promise(async (resolve, reject) => {
            // eslint-disable-next-line prefer-const
            let timer;
            const funcListener = () => listener();
            function listener() {
                station.removeListener("close", funcListener);
                clearTimeout(timer);
                resolve(true);
            }
            station.addListener("close", funcListener);
            timer = setTimeout(() => {
                station.removeListener("close", funcListener);
                reject(false);
            }, timeout);
            try {
                this.stations[station.getSerial()].close();
            }
            catch (e) {
                station.removeListener("close", funcListener);
                reject(e);
            }
        });
    }
    /**
     * Update the infos of all connected devices over P2P.
     */
    async updateDeviceData() {
        await this.httpService.refreshAllData().catch(err => {
            const error = (0, error_1.ensureError)(err);
            logging_1.rootAddonLogger.error("Error occured at updateDeviceData while API data refreshing.", error);
        });
        Object.values(this.stations).forEach(async (station) => {
            if (station.isConnected() && station.getDeviceType() !== http_1.DeviceType.DOORBELL) {
                station.getCameraInfo();
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
            throw new error_1.NotSupportedError("This functionality is not implemented or supported by this device", { context: { device: deviceSerial, commandName: http_1.CommandName.DeviceStartLivestream } });
        }
        const camera = device;
        if (!station.isLiveStreaming(camera)) {
            station.startLivestream(camera);
            if (this.cameraMaxLivestreamSeconds > 0) {
                this.cameraStationLivestreamTimeout.set(deviceSerial, setTimeout(() => {
                    logging_1.rootAddonLogger.info(`Stopping the station stream for the device ${deviceSerial}, because we have reached the configured maximum stream timeout (${this.cameraMaxLivestreamSeconds} seconds)`);
                    this.stopStationLivestream(deviceSerial);
                }, this.cameraMaxLivestreamSeconds * 1000));
            }
        }
        else {
            logging_1.rootAddonLogger.warn(`The station stream for the device ${deviceSerial} cannot be started, because it is already streaming!`);
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
            throw new error_1.NotSupportedError("This functionality is not implemented or supported by this device", { context: { device: deviceSerial, commandName: http_1.CommandName.DeviceStopLivestream } });
        }
        if (station.isConnected() && station.isLiveStreaming(device)) {
            station.stopLivestream(device);
        }
        else {
            logging_1.rootAddonLogger.warn(`The station stream for the device ${deviceSerial} cannot be stopped, because it isn't streaming!`);
        }
        const timeout = this.cameraStationLivestreamTimeout.get(deviceSerial);
        if (timeout) {
            clearTimeout(timeout);
            this.cameraStationLivestreamTimeout.delete(deviceSerial);
        }
    }
    /**
     * Start the download from station for a given device.
     * @param deviceSerial The serial of the device.
     * @param path The path of the file.
     * @param cipherID The cipher id.
     */
    async startStationDownload(deviceSerial, path, cipherID) {
        const device = await this.api.getDevice(deviceSerial);
        const station = await this.getStation(device.getStationSerial());
        if (!device.hasCommand(http_1.CommandName.DeviceStartDownload))
            throw new error_1.NotSupportedError("This functionality is not implemented or supported by this device", { context: { device: deviceSerial, commandName: http_1.CommandName.DeviceStartDownload, path: path, cipherID: cipherID } });
        if (!station.isDownloading(device)) {
            await station.startDownload(device, path, cipherID);
        }
        else {
            logging_1.rootAddonLogger.warn(`The station is already downloading a video for the device ${deviceSerial}!`);
        }
    }
    /**
     * Cancel the download from station for a given device.
     * @param deviceSerial The serial of the device.
     */
    async cancelStationDownload(deviceSerial) {
        const device = await this.api.getDevice(deviceSerial);
        const station = await this.getStation(device.getStationSerial());
        if (!device.hasCommand(http_1.CommandName.DeviceCancelDownload))
            throw new error_1.NotSupportedError("This functionality is not implemented or supported by this device", { context: { device: deviceSerial, commandName: http_1.CommandName.DeviceCancelDownload } });
        if (station.isConnected() && station.isDownloading(device)) {
            station.cancelDownload(device);
        }
        else {
            logging_1.rootAddonLogger.warn(`The station isn't downloading a video for the device ${deviceSerial}!`);
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
        if (this.stationsLoaded) {
            await this.stationsLoaded;
        }
        return this.stations;
    }
    /**
     * Returns the serial object specified by the station serial.
     * @param stationSerial The serial of the station to retrive.
     * @returns The station object.
     */
    async getStation(stationSerial) {
        if (this.stationsLoaded) {
            await this.stationsLoaded;
        }
        if (Object.keys(this.stations).includes(stationSerial)) {
            return this.stations[stationSerial];
        }
        throw new error_1.StationNotFoundError("Station doesn't exists", { context: { station: stationSerial } });
    }
    /**
     * Checks if a station with the given serial exists.
     * @param stationSerial The stationSerial of the station to check.
     * @returns True if station exists, otherwise false.
     */
    existStation(stationSerial) {
        const res = this.stations[stationSerial];
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
        const res = {};
        for (const stationSerial in this.stations) {
            res[stationSerial] = this.stations[stationSerial].getGuardMode();
        }
        return res;
    }
    /**
     * Set the guard mode of all stations to the given mode.
     * @param guardMode The target guard mode.
     */
    async setGuardMode(guardMode) {
        let err = 0;
        for (const stationSerial in this.stations) {
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
            const res = await this.waitForGuardModeEvent(this.stations[stationSerial], guardMode, 10000).then(() => {
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
     * @param station The station for waiting for the GuardMode event.
     * @param guardMode The guard mode to set.
     * @param timeout The timespan in ms maximal to wait for the event.
     * @returns Returns true or false.
     */
    async waitForGuardModeEvent(station, guardMode, timeout) {
        return new Promise(async (resolve, reject) => {
            // eslint-disable-next-line prefer-const
            let timer;
            const funcListener = () => listener();
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
                this.setStationProperty(station.getSerial(), http_1.PropertyName.StationGuardMode, guardMode);
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
            for (const serial in this.stations) {
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
                station.getStorageInfoEx();
            }
        }
        catch (err) {
            const error = (0, error_1.ensureError)(err);
            logging_1.rootAddonLogger.error("getStorageInfo Error", { error: (0, utils_2.getError)(error), stationSN: stationSerial });
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
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("connect")} Listener.`);
                break;
            case "ConnectionError":
                station.on("connection error", (station, error) => this.onStationConnectionError(station, error));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("connection error")} Listeners.`);
                break;
            case "Close":
                station.on("close", (station) => this.onStationClose(station));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("close")} Listener.`);
                break;
            case "RawDevicePropertyChanged":
                station.on("raw device property changed", (deviceSerial, params) => this.onStationRawDevicePropertyChanged(deviceSerial, params));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("raw device property changed")} Listener.`);
                break;
            case "LivestreamStart":
                station.on("livestream start", (station, channel, metadata, videoStream, audioStream) => this.onStartStationLivestream(station, channel, metadata, videoStream, audioStream));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("livestream start")} Listener.`);
                break;
            case "LivestreamStop":
                station.on("livestream stop", (station, channel) => this.onStopStationLivestream(station, channel));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("livestream stop")} Listener.`);
                break;
            case "LivestreamError":
                station.on("livestream error", (station, channel, error) => this.onErrorStationLivestream(station, channel, error));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("livestream error")} Listener.`);
                break;
            case "DownloadStart":
                station.on("download start", (station, channel, metadata, videoStream, audioStream) => this.onStationDownloadStart(station, channel, metadata, videoStream, audioStream));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("download start")} Listener.`);
                break;
            case "DownloadFinish":
                station.on("download finish", (station, channel) => this.onStationDownloadFinish(station, channel));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("download finish")} Listener.`);
                break;
            case "CommandResult":
                station.on("command result", (station, result) => this.onStationCommandResult(station, result));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("command result")} Listener.`);
                break;
            case "GuardMode":
                station.on("guard mode", (station, guardMode) => this.onStationGuardMode(station, guardMode));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("guard mode")} Listener.`);
                break;
            case "CurrentMode":
                station.on("current mode", (station, guardMode) => this.onStationCurrentMode(station, guardMode));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("current mode")} Listener.`);
                break;
            case "RTSPLivestreamStart":
                station.on("rtsp livestream start", (station, channel) => this.onStationRTSPLivestreamStart(station, channel));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("rtsp livestream start")} Listener.`);
                break;
            case "RTSPLivestreamStop":
                station.on("rtsp livestream stop", (station, channel) => this.onStationRTSPLivestreamStop(station, channel));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("rtsp livestream stop")} Listener.`);
                break;
            case "RTSPUrl":
                station.on("rtsp url", (station, channel, value) => this.onStationRTSPURL(station, channel, value));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("rtsp url")} Listener.`);
                break;
            case "PropertyChanged":
                station.on("property changed", (station, name, value, ready) => this.onStationPropertyChanged(station, name, value, ready));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("property changed")} Listener.`);
                break;
            case "RawPropertyChanged":
                station.on("raw property changed", (station, type, value) => this.onStationRawPropertyChanged(station, type, value));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("raw property changed")} Listener.`);
                break;
            case "AlarmEvent":
                station.on("alarm event", (station, alarmEvent) => this.onStationAlarmEvent(station, alarmEvent));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("alarm event")} Listener.`);
                break;
            case "RuntimeState":
                station.on("runtime state", (station, channel, batteryLevel, temperature) => this.onStationRuntimeState(station, channel, batteryLevel, temperature));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("runtime state")} Listener.`);
                break;
            case "ChargingState":
                station.on("charging state", (station, channel, chargeType, batteryLevel) => this.onStationChargingState(station, channel, chargeType, batteryLevel));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("charging state")} Listener.`);
                break;
            case "WifiRssi":
                station.on("wifi rssi", (station, channel, rssi) => this.onStationWifiRssi(station, channel, rssi));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("wifi rssi")} Listener.`);
                break;
            case "FloodlightManualSwitch":
                station.on("floodlight manual switch", (station, channel, enabled) => this.onStationFloodlightManualSwitch(station, channel, enabled));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("floodlight manual switch")} Listener.`);
                break;
            case "AlarmDelayEvent":
                station.on("alarm delay event", (station, alarmDelayEvent, alarmDelay) => this.onStationAlarmDelayEvent(station, alarmDelayEvent, alarmDelay));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("alarm delay event")} Listener.`);
                break;
            case "TalkbackStarted":
                station.on("talkback started", (station, channel, talkbackStream) => this.onStationTalkbackStarted(station, channel, talkbackStream));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("talkback started")} Listener.`);
                break;
            case "TalkbackStopped":
                station.on("talkback stopped", (station, channel) => this.onStationTalkbackStopped(station, channel));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("talkback stopped")} Listener.`);
                break;
            case "TalkbackError":
                station.on("talkback error", (station, channel, error) => this.onStationTalkbackError(station, channel, error));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("talkback error")} Listener.`);
                break;
            case "AlarmArmedEvent":
                station.on("alarm armed event", (station) => this.onStationAlarmArmedEvent(station));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("alarm armed event")} Listener.`);
                break;
            case "AlarmArmDelayEvent":
                station.on("alarm arm delay event", (station, alarmDelay) => this.onStationArmDelayEvent(station, alarmDelay));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("alarm arm delay event")} Listener.`);
                break;
            case "SecondaryCommandResult":
                station.on("secondary command result", (station, result) => this.onStationSecondaryCommandResult(station, result));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("secondary command result")} Listener.`);
                break;
            case "DeviceShakeAlarm":
                station.on("device shake alarm", (deviceSerial, event) => this.onStationDeviceShakeAlarm(deviceSerial, event));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("device shake alarm")} Listener.`);
                break;
            case "Device911Alarm":
                station.on("device 911 alarm", (deviceSerial, event) => this.onStationDevice911Alarm(deviceSerial, event));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("device 911 alarm")} Listener.`);
                break;
            case "DeviceJammed":
                station.on("device jammed", (deviceSerial) => this.onStationDeviceJammed(deviceSerial));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("device jammed")} Listener.`);
                break;
            case "DeviceLowBattery":
                station.on("device low battery", (deviceSerial) => this.onStationDeviceLowBattery(deviceSerial));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("device low battery")} Listener.`);
                break;
            case "DeviceWrongTryProtectAlarm":
                station.on("device wrong try-protect alarm", (deviceSerial) => this.onStationDeviceWrongTryProtectAlarm(deviceSerial));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("device wrong try-protect alarm")} Listener.`);
                break;
            case "DevicePinVerified":
                station.on("device pin verified", (deviceSN, successfull) => this.onStationDevicePinVerified(deviceSN, successfull));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("device pin verified")} Listener.`);
                break;
            case "SdInfoEx":
                station.on("sd info ex", (station, sdStatus, sdCapacity, sdCapacityAvailable) => this.onStationSdInfoEx(station, sdStatus, sdCapacity, sdCapacityAvailable));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("sd info ex")} Listener.`);
                break;
            case "ImageDownload":
                station.on("image download", (station, file, image) => this.onStationImageDownload(station, file, image));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("image download")} Listener.`);
                break;
            case "DatabaseQueryLatest":
                station.on("database query latest", (station, returnCode, data) => this.onStationDatabaseQueryLatest(station, returnCode, data));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("database query latest")} Listener.`);
                break;
            case "DatabaseQueryLocal":
                station.on("database query local", (station, returnCode, data) => this.onStationDatabaseQueryLocal(station, returnCode, data));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("database query local")} Listener.`);
                break;
            case "DatabaseCountByDate":
                station.on("database count by date", (station, returnCode, data) => this.onStationDatabaseCountByDate(station, returnCode, data));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("database count by date")} Listener.`);
                break;
            case "DatabaseDelete":
                station.on("database delete", (station, returnCode, failedIds) => this.onStationDatabaseDelete(station, returnCode, failedIds));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("database delete")} Listener.`);
                break;
            case "SensorStatus":
                station.on("sensor status", (station, channel, status) => this.onStationSensorStatus(station, channel, status));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("sensor status")} Listener.`);
                break;
            case "GarageDoorStatus":
                station.on("garage door status", (station, channel, doorId, status) => this.onStationGarageDoorStatus(station, channel, doorId, status));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("garage door status")} Listener.`);
                break;
            case "StorageInfoHb3":
                station.on("storage info hb3", (station, channel, storageInfo) => this.onStorageInfoHb3(station, channel, storageInfo));
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} added. Total ${station.listenerCount("garage door status")} Listener.`);
                break;
            default:
                logging_1.rootAddonLogger.info(`The listener '${eventListenerName}' for station ${station.getSerial()} is unknown.`);
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
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("connect")} Listener.`);
                break;
            case "ConnectionError":
                station.removeAllListeners("connection error");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("connection error")} Listener.`);
                break;
            case "Close":
                station.removeAllListeners("close");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("close")} Listener.`);
                break;
            case "RawDevicePropertyChanged":
                station.removeAllListeners("raw device property changed");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("raw device property changed")} Listener.`);
                break;
            case "LivestreamStart":
                station.removeAllListeners("livestream start");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("livestream start")} Listener.`);
                break;
            case "LivestreamStop":
                station.removeAllListeners("livestream stop");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("livestream stop")} Listener.`);
                break;
            case "LivestreamError":
                station.removeAllListeners("livestream error");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("livestream error")} Listener.`);
                break;
            case "DownloadStart":
                station.removeAllListeners("download start");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("download start")} Listener.`);
                break;
            case "DownloadFinish":
                station.removeAllListeners("download finish");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("download finish")} Listener.`);
                break;
            case "CommandResult":
                station.removeAllListeners("command result");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("command result")} Listener.`);
                break;
            case "GuardMode":
                station.removeAllListeners("guard mode");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("guard mode")} Listener.`);
                break;
            case "CurrentMode":
                station.removeAllListeners("current mode");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("current mode")} Listener.`);
                break;
            case "RTSPLivestreamStart":
                station.removeAllListeners("rtsp livestream start");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("rtsp livestream start")} Listener.`);
                break;
            case "RTSPLivestreamStop":
                station.removeAllListeners("rtsp livestream stop");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("rtsp livestream stop")} Listener.`);
                break;
            case "RTSPUrl":
                station.removeAllListeners("rtsp url");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("rtsp url")} Listener.`);
                break;
            case "PropertyChanged":
                station.removeAllListeners("property changed");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("property changed")} Listener.`);
                break;
            case "RawPropertyChanged":
                station.removeAllListeners("raw property changed");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("raw property changed")} Listener.`);
                break;
            case "AlarmEvent":
                station.removeAllListeners("alarm event");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("alarm event")} Listener.`);
                break;
            case "RuntimeState":
                station.removeAllListeners("runtime state");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("runtime state")} Listener.`);
                break;
            case "ChargingState":
                station.removeAllListeners("charging state");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("charging state")} Listener.`);
                break;
            case "WifiRssi":
                station.removeAllListeners("wifi rssi");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("wifi rssi")} Listener.`);
                break;
            case "FloodlightManualSwitch":
                station.removeAllListeners("floodlight manual switch");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("floodlight manual switch")} Listener.`);
                break;
            case "AlarmDelayEvent":
                station.removeAllListeners("alarm delay event");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("alarm delay event")} Listener.`);
                break;
            case "TalkbackStarted":
                station.removeAllListeners("talkback started");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("talkback started")} Listener.`);
                break;
            case "TalkbackStopped":
                station.removeAllListeners("talkback stopped");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("talkback stopped")} Listener.`);
                break;
            case "TalkbackError":
                station.removeAllListeners("talkback error");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("talkback error")} Listener.`);
                break;
            case "AlarmArmedEvent":
                station.removeAllListeners("alarm armed event");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("alarm armed event")} Listener.`);
                break;
            case "AlarmArmDelayEvent":
                station.removeAllListeners("alarm arm delay event");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("alarm arm delay event")} Listener.`);
                break;
            case "SecondaryCommandResult":
                station.removeAllListeners("secondary command result");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("secondary command result")} Listener.`);
                break;
            case "DeviceShakeAlarm":
                station.removeAllListeners("device shake alarm");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("device shake alarm")} Listener.`);
                break;
            case "Device911Alarm":
                station.removeAllListeners("device 911 alarm");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("device 911 alarm")} Listener.`);
                break;
            case "DeviceJammed":
                station.removeAllListeners("device jammed");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("device jammed")} Listener.`);
                break;
            case "DeviceLowBattery":
                station.removeAllListeners("device low battery");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("device low battery")} Listener.`);
                break;
            case "DeviceWrongTryProtectAlarm":
                station.removeAllListeners("device wrong try-protect alarm");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("device wrong try-protect alarm")} Listener.`);
                break;
            case "DevicePinVerified":
                station.removeAllListeners("device pin verified");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("device pin verified")} Listener.`);
                break;
            case "SdInfoEx":
                station.removeAllListeners("sd info ex");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("sd info ex")} Listener.`);
                break;
            case "ImageDownload":
                station.removeAllListeners("image download");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("image download")} Listener.`);
                break;
            case "DatabaseQueryLatest":
                station.removeAllListeners("database query latest");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("database query latest")} Listener.`);
                break;
            case "DatabaseQueryLocal":
                station.removeAllListeners("database query local");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("database query local")} Listener.`);
                break;
            case "DatabaseCountByDate":
                station.removeAllListeners("database count by date");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("database count by date")} Listener.`);
                break;
            case "DatabaseDelete":
                station.removeAllListeners("database delete");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("database delete")} Listener.`);
                break;
            case "SensorStatus":
                station.removeAllListeners("sensor status");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("sensor status")} Listener.`);
                break;
            case "GarageDoorStatus":
                station.removeAllListeners("garage door status");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("garage door status")} Listener.`);
                break;
            case "StorageInfoHb3":
                station.removeAllListeners("storage info hb3");
                logging_1.rootAddonLogger.debug(`Listener '${eventListenerName}' for station ${station.getSerial()} removed. Total ${station.listenerCount("storage info hb3")} Listener.`);
                break;
            default:
                logging_1.rootAddonLogger.info(`The listener '${eventListenerName}' for station ${station.getSerial()} is unknown and could not be removed.`);
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
            case "DatabaseQueryLatest":
                return station.listenerCount("database query latest");
            case "DatabaseCountByDate":
                return station.listenerCount("database count by date");
            case "DatabaseDelete":
                return station.listenerCount("database delete");
            case "SensorStatus":
                return station.listenerCount("sensor status");
            case "GarageDoorStatus":
                return station.listenerCount("garage door status");
            case "StorageInfoHb3":
                return station.listenerCount("storage info hb3");
            default:
                logging_1.rootAddonLogger.info(`The listener '${eventListenerName}' for station ${station.getSerial()} is unknown and could not be count.`);
        }
        return -1;
    }
    /**
     * The action to be done when event Connect is fired.
     * @param station The station as Station object.
     */
    async onStationConnect(station) {
        this.emit("station connect", station);
        if (http_1.Station.isStation(station.getDeviceType()) || (http_1.Device.isCamera(station.getDeviceType()) && !http_1.Device.isWiredDoorbell(station.getDeviceType()) || http_1.Device.isSmartSafe(station.getDeviceType()))) {
            station.getCameraInfo();
            if (this.refreshEufySecurityP2PTimeout[station.getSerial()] !== undefined) {
                clearTimeout(this.refreshEufySecurityP2PTimeout[station.getSerial()]);
                delete this.refreshEufySecurityP2PTimeout[station.getSerial()];
            }
            this.refreshEufySecurityP2PTimeout[station.getSerial()] = setTimeout(() => {
                station.getCameraInfo();
            }, this.P2P_REFRESH_INTERVAL_MIN * 60 * 1000);
        }
        else if (http_1.Device.isLock(station.getDeviceType())) {
            station.getLockParameters();
            station.getLockStatus();
            if (this.refreshEufySecurityP2PTimeout[station.getSerial()] !== undefined) {
                clearTimeout(this.refreshEufySecurityP2PTimeout[station.getSerial()]);
                delete this.refreshEufySecurityP2PTimeout[station.getSerial()];
            }
            this.refreshEufySecurityP2PTimeout[station.getSerial()] = setTimeout(() => {
                station.getLockParameters();
                station.getLockStatus();
            }, this.P2P_REFRESH_INTERVAL_MIN * 60 * 1000);
        }
    }
    /**
     * The action to be done when event Connection Error is fired.
     * @param station The station as Station object.
     * @param error Ther error occured.
     */
    onStationConnectionError(station, error) {
        logging_1.rootAddonLogger.debug(`Event "ConnectionError": station: ${station.getSerial()}`);
        this.emit("station connection error", station, error);
    }
    /**
     * The action to be done when event Close is fired.
     * @param station The station as Station object.
     */
    async onStationClose(station) {
        logging_1.rootAddonLogger.info(`Event "Close": station: ${station.getSerial()}`);
        this.emit("station close", station);
        if (this.api.getServiceState() != "shutdown") {
        }
        for (const device_sn of this.cameraStationLivestreamTimeout.keys()) {
            this.api.getDevice(device_sn).then((device) => {
                if (device !== null && device.getStationSerial() === station.getSerial()) {
                    clearTimeout(this.cameraStationLivestreamTimeout.get(device_sn));
                    this.cameraStationLivestreamTimeout.delete(device_sn);
                }
            }).catch((err) => {
                const error = (0, error_1.ensureError)(err);
                logging_1.rootAddonLogger.error(`Station close Error`, { error: (0, utils_2.getError)(error), stationSN: station.getSerial() });
            });
        }
    }
    /**
     * The action to be done when event RawDevicePropertyChanged is fired.
     * @param deviceSerial The serial of the device the raw values changed for.
     * @param values The raw values for the device.
     */
    async onStationRawDevicePropertyChanged(deviceSerial, values) {
        logging_1.rootAddonLogger.debug(`Event "RawDevicePropertyChanged": device: ${deviceSerial} | values: ${values}`);
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
    async onStartStationLivestream(station, channel, metadata, videoStream, audioStream) {
        logging_1.rootAddonLogger.debug(`Event "LivestreamStart": station: ${station.getSerial()} | channel: ${channel}`);
        this.api.getStationDevice(station.getSerial(), channel).then((device) => {
            this.emit("station livestream start", station, device, metadata, videoStream, audioStream);
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            logging_1.rootAddonLogger.error(`Station start livestream error`, { error: (0, utils_2.getError)(error), stationSN: station.getSerial(), channel: channel, metadata: metadata });
        });
    }
    /**
     * The action to be done when event LivestreamStop is fired.
     * @param station The station as Station object.
     * @param channel The channel to define the device.
     */
    async onStopStationLivestream(station, channel) {
        logging_1.rootAddonLogger.debug(`Event "LivestreamStop": station: ${station.getSerial()} | channel: ${channel}`);
        this.api.getStationDevice(station.getSerial(), channel).then((device) => {
            this.emit("station livestream stop", station, device);
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            logging_1.rootAddonLogger.error(`Station stop livestream error`, { error: (0, utils_2.getError)(error), stationSN: station.getSerial(), channel: channel });
        });
    }
    /**
     * The action to be done when event LivestreamError is fired.
     * @param station The station as Station object.
     * @param channel The channel to define the device.
     */
    async onErrorStationLivestream(station, channel, origError) {
        this.api.getStationDevice(station.getSerial(), channel).then((device) => {
            station.stopLivestream(device);
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            logging_1.rootAddonLogger.error(`Station livestream error`, { error: (0, utils_2.getError)(error), stationSN: station.getSerial(), channel: channel, origError: (0, utils_2.getError)(origError) });
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
        logging_1.rootAddonLogger.debug(`Event "DownloadStart": station: ${station.getSerial()} | channel: ${channel}`);
        this.api.getStationDevice(station.getSerial(), channel).then((device) => {
            this.emit("station download start", station, device, metadata, videoStream, audioStream);
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            logging_1.rootAddonLogger.error(`Station start download error`, { error: (0, utils_2.getError)(error), stationSN: station.getSerial(), channel: channel, metadata: metadata });
        });
    }
    /**
     * The action to be done when event DownloadFinish is fired.
     * @param station The station as Station object.
     * @param channel The channel to define the device.
     */
    async onStationDownloadFinish(station, channel) {
        logging_1.rootAddonLogger.debug(`Event "DownloadFinish": station: ${station.getSerial()} | channel: ${channel}`);
        this.api.getStationDevice(station.getSerial(), channel).then((device) => {
            this.emit("station download finish", station, device);
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            logging_1.rootAddonLogger.error(`Station finish download error`, { error: (0, utils_2.getError)(error), stationSN: station.getSerial(), channel: channel });
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
            if (result.customData !== undefined && result.customData.onSuccess !== undefined) {
                try {
                    result.customData.onSuccess();
                }
                catch (err) {
                    const error = (0, error_1.ensureError)(err);
                    logging_1.rootAddonLogger.error(`Station command result - onSuccess callback error`, { error: (0, utils_2.getError)(error), stationSN: station.getSerial(), result: result });
                }
            }
            this.api.getStationDevice(station.getSerial(), result.channel).then((device) => {
                if ((result.customData !== undefined && result.customData.property !== undefined && !device.isLockWifiR10() && !device.isLockWifiR20() && !device.isSmartSafe() && !device.isLockWifiT8506() && !device.isLockWifiT8502() && !device.isLockWifiT8510P() && !device.isLockWifiT8520P()) ||
                    (result.customData !== undefined && result.customData.property !== undefined && device.isSmartSafe() && result.command_type !== p2p_1.CommandType.CMD_SMARTSAFE_SETTINGS) ||
                    (result.customData !== undefined && result.customData.property !== undefined && (device.isLockWifiT8506() || device.isLockWifiT8502() || device.isLockWifiT8510P() || device.isLockWifiT8520P()) && result.command_type !== p2p_1.CommandType.CMD_DOORLOCK_SET_PUSH_MODE)) {
                    if (device.hasProperty(result.customData.property.name)) {
                        const metadata = device.getPropertyMetadata(result.customData.property.name);
                        if (typeof result.customData.property.value !== "object" || metadata.type === "object") {
                            device.updateProperty(result.customData.property.name, result.customData.property.value);
                        }
                    }
                    else if (station.hasProperty(result.customData.property.name)) {
                        const metadata = station.getPropertyMetadata(result.customData.property.name);
                        if (typeof result.customData.property.value !== "object" || metadata.type === "object") {
                            station.updateProperty(result.customData.property.name, result.customData.property.value);
                        }
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
                    }).catch(err => {
                        const error = (0, error_1.ensureError)(err);
                        logging_1.rootAddonLogger.error("Error during API data refreshing", { error: (0, utils_2.getError)(error) });
                    });
                }
            }).catch((err) => {
                const error = (0, error_1.ensureError)(err);
                if (error instanceof error_1.DeviceNotFoundError) {
                    if (result.customData !== undefined && result.customData.property !== undefined) {
                        station.updateProperty(result.customData.property.name, result.customData.property.value);
                    }
                }
                else {
                    logging_1.rootAddonLogger.error(`Station command result error`, { error: (0, utils_2.getError)(error), stationSN: station.getSerial(), result: result });
                }
            });
            if (station.isIntegratedDevice() && result.command_type === p2p_1.CommandType.CMD_SET_ARMING && station.isConnected() && station.getDeviceType() !== http_1.DeviceType.DOORBELL) {
                station.getCameraInfo();
            }
        }
        else {
            if (result.customData !== undefined && result.customData.onFailure !== undefined) {
                try {
                    result.customData.onFailure();
                }
                catch (err) {
                    const error = (0, error_1.ensureError)(err);
                    logging_1.rootAddonLogger.error(`Station command result - onFailure callback error`, { error: (0, utils_2.getError)(error), stationSN: station.getSerial(), result: result });
                }
            }
        }
        if (result.customData !== undefined && result.customData.command !== undefined) {
            const customValue = result.customData.command.value;
            switch (result.customData.command.name) {
                case http_1.CommandName.DeviceAddUser:
                    this.api.getStationDevice(station.getSerial(), result.channel).then((device) => {
                        switch (result.return_code) {
                            case 0:
                                this.emit("user added", device, customValue.username, customValue.schedule);
                                break;
                            case 4:
                                this.emit("user error", device, customValue.username, new error_1.AddUserError("Passcode already used by another user, please choose a different one", { context: { device: device.getSerial(), username: customValue.username, schedule: customValue.schedule } }));
                                break;
                            default:
                                this.emit("user error", device, customValue.username, new error_1.AddUserError("Error creating user", { context: { device: device.getSerial(), username: customValue.username, schedule: customValue.schedule, returnode: result.return_code } }));
                                break;
                        }
                    });
                    break;
                case http_1.CommandName.DeviceDeleteUser:
                    this.api.getStationDevice(station.getSerial(), result.channel).then((device) => {
                        switch (result.return_code) {
                            case 0:
                                this.httpService.deleteUser(device.getSerial(), customValue.shortUserId, device.getStationSerial()).then((result) => {
                                    if (result) {
                                        this.emit("user deleted", device, customValue.username);
                                    }
                                    else {
                                        this.emit("user error", device, customValue.username, new error_1.DeleteUserError("Error in deleting user through cloud api call", { context: { device: device.getSerial(), username: customValue.username, shortUserId: customValue.short_user_id } }));
                                    }
                                });
                                break;
                            default:
                                this.emit("user error", device, customValue.username, new error_1.DeleteUserError("Error deleting user", { context: { device: device.getSerial(), username: customValue.username, shortUserId: customValue.short_user_id, returnCode: result.return_code } }));
                                break;
                        }
                    });
                    break;
                case http_1.CommandName.DeviceUpdateUserPasscode:
                    this.api.getStationDevice(station.getSerial(), result.channel).then((device) => {
                        switch (result.return_code) {
                            case 0:
                                this.emit("user passcode updated", device, customValue.username);
                                break;
                            default:
                                this.emit("user error", device, customValue.username, new error_1.UpdateUserPasscodeError("Error updating user passcode", { context: { device: device.getSerial(), username: customValue.username, returnCode: result.return_code } }));
                                break;
                        }
                    });
                    break;
                case http_1.CommandName.DeviceUpdateUserSchedule:
                    this.api.getStationDevice(station.getSerial(), result.channel).then((device) => {
                        switch (result.return_code) {
                            case 0:
                                this.emit("user schedule updated", device, customValue.username, customValue.schedule);
                                break;
                            default:
                                this.emit("user error", device, customValue.username, new error_1.UpdateUserScheduleError("Error updating user schedule", { context: { device: device.getSerial(), username: customValue.username, schedule: customValue.schedule, returnCode: result.return_code } }));
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
        logging_1.rootAddonLogger.debug(`Event "SecondaryCommandResult": station: ${station.getSerial()} | result: ${result}`);
        if (result.return_code === 0) {
            this.api.getStationDevice(station.getSerial(), result.channel).then((device) => {
                if (result.customData !== undefined && result.customData.property !== undefined) {
                    if (device.hasProperty(result.customData.property.name)) {
                        device.updateProperty(result.customData.property.name, result.customData.property.value);
                    }
                    else if (station.hasProperty(result.customData.property.name)) {
                        station.updateProperty(result.customData.property.name, result.customData.property.value);
                    }
                }
            }).catch((err) => {
                const error = (0, error_1.ensureError)(err);
                if (error instanceof error_1.DeviceNotFoundError) {
                    if (result.customData !== undefined && result.customData.property !== undefined) {
                        station.updateProperty(result.customData.property.name, result.customData.property.value);
                    }
                }
                else {
                    logging_1.rootAddonLogger.error(`Station secondary command result error`, { error: (0, utils_2.getError)(error), stationSN: station.getSerial(), result: result });
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
            logging_1.rootAddonLogger.debug("Event skipped due to locally forced changeGuardMode.");
            this.skipNextModeChangeEvent[station.getSerial()] = false;
        }
        else {
            logging_1.rootAddonLogger.debug(`Event "GuardMode": station: ${station.getSerial()} | guard mode: ${guardMode}`);
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
            logging_1.rootAddonLogger.debug("Event skipped due to locally forced changeCurrentMode.");
            this.skipNextModeChangeEvent[station.getSerial()] = false;
        }
        else {
            logging_1.rootAddonLogger.debug(`Event "CurrentMode": station: ${station.getSerial()} | guard mode: ${guardMode}`);
            await this.api.updateGuardModeStation(station.getSerial());
        }
    }
    /**
     * The action to be done when event RTSPLivestreamStart is fired.
     * @param station The station as Station object.
     * @param channel The channel to define the device.
     */
    async onStationRTSPLivestreamStart(station, channel) {
        logging_1.rootAddonLogger.debug(`Event "RTSPLivestreamStart": station: ${station.getSerial()} | channel: ${channel}`);
        this.api.getStationDevice(station.getSerial(), channel).then((device) => {
            this.emit("station rtsp livestream start", station, device);
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            logging_1.rootAddonLogger.error(`Station start rtsp livestream error`, { error: (0, utils_2.getError)(error), stationSN: station.getSerial(), channel: channel });
        });
    }
    /**
     * The action to be done when event RTSPLivestreamStop is fired.
     * @param station The station as Station object.
     * @param channel The channel to define the device.
     */
    async onStationRTSPLivestreamStop(station, channel) {
        logging_1.rootAddonLogger.debug(`Event "RTSPLivestreamStop": station: ${station.getSerial()} | channel: ${channel}`);
        this.api.getStationDevice(station.getSerial(), channel).then((device) => {
            this.emit("station rtsp livestream stop", station, device);
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            logging_1.rootAddonLogger.error(`Station stop rtsp livestream error`, { error: (0, utils_2.getError)(error), stationSN: station.getSerial(), channel: channel });
        });
    }
    /**
     * The action to be done when event RTSPURL is fired.
     * @param station The station as Station object.
     * @param channel The channel to define the device.
     */
    async onStationRTSPURL(station, channel, value) {
        logging_1.rootAddonLogger.debug(`Event "RTSPURL": station: ${station.getSerial()} | channel: ${channel}`);
        this.api.getStationDevice(station.getSerial(), channel).then((device) => {
            this.emit("station rtsp url", station, device, value);
            device.setCustomPropertyValue(http_1.PropertyName.DeviceRTSPStreamUrl, value);
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            logging_1.rootAddonLogger.error(`Station rtsp url error`, { error: (0, utils_2.getError)(error), stationSN: station.getSerial(), channel: channel, url: value });
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
            logging_1.rootAddonLogger.debug(`Event "PropertyChanged": station: ${station.getSerial()} | name: ${name} | value: ${value}`);
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
            logging_1.rootAddonLogger.debug(`Event "RawPropertyChanged": station: ${station.getSerial()} | type: ${type} | value: ${value}`);
        }
    }
    /**
     * The action to be done when event AlarmEvent is fired.
     * @param station The station as Station object.
     * @param alarmEvent The alarmEvent.
     */
    async onStationAlarmEvent(station, alarmEvent) {
        logging_1.rootAddonLogger.debug(`Event "AlarmEvent": station: ${station.getSerial()} | alarmEvent: ${alarmEvent}`);
    }
    /**
     * The action to be done when event StationRuntimeState is fired.
     * @param station The station as Station object.
     * @param channel The channel to define the device.
     * @param batteryLevel The battery level as percentage value.
     * @param temperature The temperature as degree value.
     */
    async onStationRuntimeState(station, channel, batteryLevel, temperature) {
        logging_1.rootAddonLogger.debug(`Event "RuntimeState": station: ${station.getSerial()} | channel: ${channel} | battery: ${batteryLevel} | temperature: ${temperature}`);
        this.api.getStationDevice(station.getSerial(), channel).then((device) => {
            if (device.hasProperty(http_1.PropertyName.DeviceBattery)) {
                const metadataBattery = device.getPropertyMetadata(http_1.PropertyName.DeviceBattery);
                device.updateRawProperty(metadataBattery.key, batteryLevel.toString(), "p2p");
            }
            if (device.hasProperty(http_1.PropertyName.DeviceBatteryTemp)) {
                const metadataBatteryTemperature = device.getPropertyMetadata(http_1.PropertyName.DeviceBatteryTemp);
                device.updateRawProperty(metadataBatteryTemperature.key, temperature.toString(), "p2p");
            }
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            logging_1.rootAddonLogger.error(`Station runtime state error`, { error: (0, utils_2.getError)(error), stationSN: station.getSerial(), channel: channel, batteryLevel: batteryLevel, temperature: temperature });
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
        logging_1.rootAddonLogger.debug(`Event "ChargingState": station: ${station.getSerial()} | channel: ${channel} | battery: ${batteryLevel} | type: ${chargeType}`);
        this.api.getStationDevice(station.getSerial(), channel).then((device) => {
            if (device.hasProperty(http_1.PropertyName.DeviceBattery)) {
                const metadataBattery = device.getPropertyMetadata(http_1.PropertyName.DeviceBattery);
                if ((0, utils_4.isCharging)(chargeType) && batteryLevel > 0) {
                    device.updateRawProperty(metadataBattery.key, batteryLevel.toString(), "p2p");
                }
            }
            if (device.hasProperty(http_1.PropertyName.DeviceChargingStatus)) {
                const metadataChargingStatus = device.getPropertyMetadata(http_1.PropertyName.DeviceChargingStatus);
                device.updateRawProperty(metadataChargingStatus.key, chargeType.toString(), "p2p");
            }
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            logging_1.rootAddonLogger.error(`Station charging state error`, { error: (0, utils_2.getError)(error), stationSN: station.getSerial(), channel: channel, chargeType: chargeType, charging: (0, utils_4.isCharging)(chargeType), batteryLevel: batteryLevel });
        });
    }
    /**
     * The action to be done when event StationWifiRssi is fired.
     * @param station The station as Station object.
     * @param channel The channel to define the device.
     * @param rssi The current rssi value.
     */
    async onStationWifiRssi(station, channel, rssi) {
        logging_1.rootAddonLogger.debug(`Event "WifiRssi": station: ${station.getSerial()} | channel: ${channel} | rssi: ${rssi}`);
        this.api.getStationDevice(station.getSerial(), channel).then((device) => {
            if (device.hasProperty(http_1.PropertyName.DeviceWifiRSSI)) {
                const metadataWifiRssi = device.getPropertyMetadata(http_1.PropertyName.DeviceWifiRSSI);
                device.updateRawProperty(metadataWifiRssi.key, rssi.toString(), "p2p");
            }
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            logging_1.rootAddonLogger.error(`Station wifi rssi error`, { error: (0, utils_2.getError)(error), stationSN: station.getSerial(), channel: channel, rssi: rssi });
        });
    }
    /**
     * The action to be done when event FloodlightManualSwitch is fired.
     * @param station The station as Station object.
     * @param channel The channel to define the device.
     * @param enabled The value for the floodlight.
     */
    async onStationFloodlightManualSwitch(station, channel, enabled) {
        logging_1.rootAddonLogger.debug(`Event "FloodlightManualSwitch": station: ${station.getSerial()} | channel: ${channel} | enabled: ${enabled}`);
        this.api.getStationDevice(station.getSerial(), channel).then((device) => {
            if (device.hasProperty(http_1.PropertyName.DeviceLight)) {
                const metadataLight = device.getPropertyMetadata(http_1.PropertyName.DeviceLight);
                device.updateRawProperty(metadataLight.key, enabled === true ? "1" : "0", "p2p");
            }
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            logging_1.rootAddonLogger.error(`Station floodlight manual switch error`, { error: (0, utils_2.getError)(error), stationSN: station.getSerial(), channel: channel, enabled: enabled });
        });
    }
    /**
     * The action to be done when event AlarmDelayEvent is fired.
     * @param station The station as Station object.
     * @param alarmDelayEvent The AlarmDelayedEvent.
     * @param alarmDelay The delay in ms.
     */
    async onStationAlarmDelayEvent(station, alarmDelayEvent, alarmDelay) {
        logging_1.rootAddonLogger.debug(`Event "AlarmDelayEvent": station: ${station.getSerial()} | alarmDeleayEvent: ${alarmDelayEvent} | alarmDeleay: ${alarmDelay}`);
    }
    /**
     * The action to be done when event TalkbackStarted is fired.
     * @param station The station as Station object.
     * @param channel The channel to define the device.
     * @param talkbackStream The TalbackStream object.
     */
    async onStationTalkbackStarted(station, channel, talkbackStream) {
        logging_1.rootAddonLogger.debug(`Event "TalkbackStarted": station: ${station.getSerial()} | channel: ${channel} | talkbackStream: ${talkbackStream}`);
        this.api.getStationDevice(station.getSerial(), channel).then((device) => {
            this.emit("station talkback start", station, device, talkbackStream);
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            logging_1.rootAddonLogger.error(`Station talkback start error`, { error: (0, utils_2.getError)(error), stationSN: station.getSerial(), channel: channel });
        });
    }
    /**
     * The action to be done when event TalkbackStopped is fired.
     * @param station The station as Station object.
     * @param channel The channel to define the device.
     */
    async onStationTalkbackStopped(station, channel) {
        logging_1.rootAddonLogger.debug(`Event "TalkbackStopped": station: ${station.getSerial()} | channel: ${channel}`);
        this.api.getStationDevice(station.getSerial(), channel).then((device) => {
            this.emit("station talkback stop", station, device);
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            logging_1.rootAddonLogger.error(`Station talkback stop error`, { error: (0, utils_2.getError)(error), stationSN: station.getSerial(), channel: channel });
        });
    }
    /**
     * The action to be done when event TalkbackError is fired.
     * @param station The station as Station object.
     * @param channel The channel to define the device.
     * @param error The error object.
     */
    async onStationTalkbackError(station, channel, origError) {
        logging_1.rootAddonLogger.debug(`Event "TalkbackError": station: ${station.getSerial()} | channel: ${channel} | error: ${origError}`);
        this.api.getStationDevice(station.getSerial(), channel).then((device) => {
            station.stopTalkback(device);
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            logging_1.rootAddonLogger.error(`Station talkback error`, { error: (0, utils_2.getError)(error), stationSN: station.getSerial(), channel: channel, origError: (0, utils_2.getError)(origError) });
        });
    }
    /**
     * The action to be done when event AlarmArmedEvent is fired.
     * @param station The station as Station object.
     */
    async onStationAlarmArmedEvent(station) {
        logging_1.rootAddonLogger.debug(`Event "AlarmArmedEvent": station: ${station.getSerial()}`);
    }
    /**
     * The action to be done when event AlarmArmDelayEvent is fired.
     * @param station The station as Station object.
     * @param alarmDelay The delay in ms.
     */
    async onStationArmDelayEvent(station, alarmDelay) {
        logging_1.rootAddonLogger.debug(`Event "ArmDelayEvent": station: ${station.getSerial()} | alarmDelay: ${alarmDelay}`);
    }
    /**
     * The action to be done when event DeviceShakeAlarm is fired.
     * @param deviceSerial The device serial.
     * @param event The SmartSafeShakeAlarmEvent event.
     */
    onStationDeviceShakeAlarm(deviceSerial, event) {
        logging_1.rootAddonLogger.debug(`Event "DeviceShakeAlarm": device: ${deviceSerial} | event: ${event}`);
        this.api.getDevice(deviceSerial).then((device) => {
            if (device.isSmartSafe())
                device.shakeEvent(event, this.api.getEventDurationSeconds());
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            logging_1.rootAddonLogger.error(`onStationDeviceShakeAlarm error`, { error: (0, utils_2.getError)(error), deviceSN: deviceSerial, event: p2p_1.SmartSafeShakeAlarmEvent[event] });
        });
    }
    /**
     * The action to be done when event Device911Alarm is fired.
     * @param deviceSerial The device serial.
     * @param event The SmartSafeAlarm911Event event.
     */
    onStationDevice911Alarm(deviceSerial, event) {
        logging_1.rootAddonLogger.debug(`Event "Device911Alarm": device: ${deviceSerial} | event: ${event}`);
        this.api.getDevice(deviceSerial).then((device) => {
            if (device.isSmartSafe())
                device.alarm911Event(event, this.api.getEventDurationSeconds());
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            logging_1.rootAddonLogger.error(`onStationDevice911Alarm error`, { error: (0, utils_2.getError)(error), deviceSN: deviceSerial, event: p2p_1.SmartSafeAlarm911Event[event] });
        });
    }
    /**
     * The action to be done when event DeviceJammed is fired.
     * @param deviceSerial The device serial.
     */
    onStationDeviceJammed(deviceSerial) {
        logging_1.rootAddonLogger.debug(`Event "DeviceJammed": device: ${deviceSerial}`);
        this.api.getDevice(deviceSerial).then((device) => {
            if (device.isSmartSafe())
                device.jammedEvent(this.api.getEventDurationSeconds());
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            logging_1.rootAddonLogger.error(`onStationDeviceJammed error`, { error: (0, utils_2.getError)(error), deviceSN: deviceSerial });
        });
    }
    /**
     * The action to be done when event DeviceLowBattery is fired.
     * @param deviceSerial The device serial.
     */
    onStationDeviceLowBattery(deviceSerial) {
        logging_1.rootAddonLogger.info(`Event "DeviceLowBattery": device: ${deviceSerial}`);
        this.api.getDevice(deviceSerial).then((device) => {
            if (device.isSmartSafe())
                device.lowBatteryEvent(this.api.getEventDurationSeconds());
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            logging_1.rootAddonLogger.error(`onStationDeviceLowBattery error`, { error: (0, utils_2.getError)(error), deviceSN: deviceSerial });
        });
    }
    /**
     * The action to be done when event DeviceWrongTryProtectAlarm is fired.
     * @param deviceSerial The device serial.
     */
    onStationDeviceWrongTryProtectAlarm(deviceSerial) {
        logging_1.rootAddonLogger.debug(`Event "DeviceWrongTryProtectAlarm": device: ${deviceSerial}`);
        this.api.getDevice(deviceSerial).then((device) => {
            if (device.isSmartSafe())
                device.wrongTryProtectAlarmEvent(this.api.getEventDurationSeconds());
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            logging_1.rootAddonLogger.error(`onStationDeviceWrongTryProtectAlarm error`, { error: (0, utils_2.getError)(error), deviceSN: deviceSerial });
        });
    }
    /**
     * The action to be performed when event pin verfifcation is fired.
     * @param deviceSerial The device serial.
     * @param successfull Result of pin verification.
     */
    onStationDevicePinVerified(deviceSerial, successfull) {
        logging_1.rootAddonLogger.debug(`Event "DeviceWrongTryProtectAlarm": device: ${deviceSerial}`);
        this.api.getDevice(deviceSerial).then((device) => {
            this.emit("device pin verified", device, successfull);
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            logging_1.rootAddonLogger.error(`onStationDevicePinVerified error`, { error: (0, utils_2.getError)(error), deviceSN: deviceSerial, successfull: successfull });
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
     * Update the device picture for the given device with the given picture.
     * @param station The station as Station object.
     * @param file The file name.
     * @param picture: The picture.
     */
    _emitStationImageDownload(station, file, picture) {
        this.emit("station image download", station, file, picture);
        this.api.getDevicesFromStation(station.getSerial()).then((devices) => {
            let channel = -1;
            if (path_1.default.parse(file).name.includes("_c")) {
                channel = Number.parseInt(path_1.default.parse(file).name.split("_c", 2)[1]);
            }
            else if (file.includes("/Camera")) {
                const res = file.split("/");
                for (const elem of res) {
                    if (elem.startsWith("Camera")) {
                        channel = Number.parseInt(elem.replace("Camera", ""));
                        break;
                    }
                }
            }
            if (channel == -1) {
                logging_1.rootAddonLogger.error(`onStationImageDownload - Channel could not be extracted for file '${file}' on station ${station.getSerial()}.`);
                return;
            }
            for (const device of devices) {
                //if (device.getPropertyValue(PropertyName.DevicePictureUrl) === file) {
                if (device.getSerial() === station.getSerial() || (device.getStationSerial() === station.getSerial() && device.getChannel() === channel)) {
                    logging_1.rootAddonLogger.debug(`onStationImageDownload - Set picture for device ${device.getSerial()} file: ${file} picture_ext: ${picture.type.ext} picture_mime: ${picture.type.mime}`);
                    device.updateProperty(http_1.PropertyName.DevicePicture, picture);
                    break;
                }
            }
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            logging_1.rootAddonLogger.debug(`onStationImageDownload - Set picture error`, { error: (0, utils_2.getError)(error), stationSN: station.getSerial(), file: file });
        });
    }
    /**
     * The action to be performed when event station image download is fired.
     * @param station The station as Station object.
     * @param file The file name.
     * @param image The image.
     */
    onStationImageDownload(station, file, image) {
        import("image-type").then(({ default: imageType }) => {
            imageType(image).then((type) => {
                const picture = {
                    data: image,
                    type: type !== null && type !== undefined ? type : { ext: "unknown", mime: "application/octet-stream" }
                };
                this._emitStationImageDownload(station, file, picture);
            }).catch(() => {
                this._emitStationImageDownload(station, file, {
                    data: image,
                    type: { ext: "unknown", mime: "application/octet-stream" }
                });
            });
        }).catch(() => {
            this._emitStationImageDownload(station, file, {
                data: image,
                type: { ext: "unknown", mime: "application/octet-stream" }
            });
        });
    }
    /**
     * The action to be performed when event station database query latest is fired.
     * @param station The station as Station object.
     * @param returnCode The return code of the query.
     * @param data The result data.
     */
    onStationDatabaseQueryLatest(station, returnCode, data) {
        if (returnCode === p2p_1.DatabaseReturnCode.SUCCESSFUL) {
            for (const element of data) {
                if ((element.device_sn !== "" && !station.isStation()) || (station.isStation() && element.device_sn !== station.getSerial())) {
                    if (!this.api.existDevice(element.device_sn)) {
                        continue;
                    }
                    this.api.getDevice(element.device_sn).then((device) => {
                        const raw = device.getRawDevice();
                        if ("crop_local_path" in element) {
                            raw.cover_path = element.crop_local_path;
                        }
                        else if ("crop_cloud_path" in element) {
                            raw.cover_path = element.crop_cloud_path;
                        }
                        device.update(raw);
                    }).catch((err) => {
                        const error = (0, error_1.ensureError)(err);
                        if (!(error instanceof error_1.DeviceNotFoundError)) {
                            logging_1.rootAddonLogger.error("onStationDatabaseQueryLatest Error", { error: (0, utils_2.getError)(error), stationSN: station.getSerial(), returnCode: returnCode });
                        }
                    });
                }
            }
        }
        this.emit("station database query latest", station, returnCode, data);
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
     * The action to be performed when event station database count by date is fired.
     * @param station The station as Station object.
     * @param returnCode The return code of the query.
     * @param data The result data.
     */
    onStationDatabaseCountByDate(station, returnCode, data) {
        this.emit("station database count by date", station, returnCode, data);
    }
    /**
     * The action to be performed when event station database delete is fired.
     * @param station The station as Station object.
     * @param returnCode The return code of the query.
     * @param failedIds A list of id could not be deleted.
     */
    onStationDatabaseDelete(station, returnCode, failedIds) {
        this.emit("station database delete", station, returnCode, failedIds);
    }
    /**
     * The action to be performed when event station sensor state is fired.
     * @param station The station as Station object.
     * @param channel The channel of the device.
     * @param status The status of the sensor.
     */
    onStationSensorStatus(station, channel, status) {
        this.api.getStationDevice(station.getSerial(), channel).then((device) => {
            if (device.hasProperty(http_1.PropertyName.DeviceSensorOpen)) {
                const metadataSensorOpen = device.getPropertyMetadata(http_1.PropertyName.DeviceSensorOpen);
                device.updateRawProperty(metadataSensorOpen.key, status.toString(), "p2p");
            }
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            logging_1.rootAddonLogger.error(`Station sensor status error`, { error: (0, utils_2.getError)(error), stationSN: station.getSerial(), channel: channel });
        });
    }
    /**
     * The action to be performed when event station garage door status is fired.
     * @param station The station as Station object.
     * @param channel The channel of the device.
     * @param doorId The id of the door.
     * @param status The status of the garage door.
     */
    onStationGarageDoorStatus(station, channel, doorId, status) {
        this.api.getStationDevice(station.getSerial(), channel).then((device) => {
            device.updateRawProperty(p2p_1.CommandType.CMD_CAMERA_GARAGE_DOOR_STATUS, status.toString(), "p2p");
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            logging_1.rootAddonLogger.error(`Station garage door status error`, { error: (0, utils_2.getError)(error), stationSN: station.getSerial(), channel: channel });
        });
    }
    onStorageInfoHb3(station, channel, storageInfo) {
        if (station.hasProperty(http_1.PropertyName.StationStorageInfoEmmc)) {
            station.updateProperty(http_1.PropertyName.StationStorageInfoEmmc, storageInfo.emmc_info);
        }
        if (station.hasProperty(http_1.PropertyName.StationStorageInfoHdd)) {
            station.updateProperty(http_1.PropertyName.StationStorageInfoHdd, storageInfo.hdd_info);
        }
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
                station.setGuardMode(value);
                break;
            case http_1.PropertyName.StationAlarmTone:
                station.setStationAlarmTone(value);
                break;
            case http_1.PropertyName.StationAlarmVolume:
                station.setStationAlarmRingtoneVolume(value);
                break;
            case http_1.PropertyName.StationPromptVolume:
                station.setStationPromptVolume(value);
                break;
            case http_1.PropertyName.StationNotificationSwitchModeApp:
                station.setStationNotificationSwitchMode(http_1.NotificationSwitchMode.APP, value);
                break;
            case http_1.PropertyName.StationNotificationSwitchModeGeofence:
                station.setStationNotificationSwitchMode(http_1.NotificationSwitchMode.GEOFENCE, value);
                break;
            case http_1.PropertyName.StationNotificationSwitchModeSchedule:
                station.setStationNotificationSwitchMode(http_1.NotificationSwitchMode.SCHEDULE, value);
                break;
            case http_1.PropertyName.StationNotificationSwitchModeKeypad:
                station.setStationNotificationSwitchMode(http_1.NotificationSwitchMode.KEYPAD, value);
                break;
            case http_1.PropertyName.StationNotificationStartAlarmDelay:
                station.setStationNotificationStartAlarmDelay(value);
                break;
            case http_1.PropertyName.StationTimeFormat:
                station.setStationTimeFormat(value);
                break;
            case http_1.PropertyName.StationSwitchModeWithAccessCode:
                station.setStationSwitchModeWithAccessCode(value);
                break;
            case http_1.PropertyName.StationAutoEndAlarm:
                station.setStationAutoEndAlarm(value);
                break;
            case http_1.PropertyName.StationTurnOffAlarmWithButton:
                station.setStationTurnOffAlarmWithButton(value);
                break;
            case http_1.PropertyName.StationCrossCameraTracking:
                station.setCrossCameraTracking(value);
                break;
            case http_1.PropertyName.StationContinuousTrackingTime:
                station.setContinuousTrackingTime(value);
                break;
            case http_1.PropertyName.StationTrackingAssistance:
                station.setTrackingAssistance(value);
                break;
            case http_1.PropertyName.StationCrossTrackingCameraList:
                station.setCrossTrackingCameraList(value);
                break;
            case http_1.PropertyName.StationCrossTrackingGroupList:
                station.setCrossTrackingGroupList(value);
                break;
            default:
                if (!Object.values(http_1.PropertyName).includes(name))
                    throw new error_1.ReadOnlyPropertyError("Property is read only", { context: { station: stationSerial, propertyName: name, propertyValue: value } });
                throw new http_1.InvalidPropertyError("Station has no writable property", { context: { station: stationSerial, propertyName: name, propertyValue: value } });
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
                station.addUser(device, username, addUserResponse.short_user_id, passcode, schedule);
            }
            else {
                this.emit("user error", device, username, new error_1.AddUserError("Error on creating user through cloud api call"));
            }
        }
        catch (err) {
            const error = (0, error_1.ensureError)(err);
            logging_1.rootAddonLogger.error(`addUser error`, { error: (0, utils_2.getError)(error), deviceSN: deviceSN, username: username, schedule: schedule });
            this.emit("user error", device, username, new error_1.AddUserError("Generic error", { cause: error, context: { device: deviceSN, username: username, passcode: "[redacted]", schedule: schedule } }));
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
            throw new error_1.NotSupportedError("This functionality is not implemented or supported by this device", { context: { device: deviceSN, commandName: http_1.CommandName.DeviceDeleteUser, username: username } });
        }
        try {
            const users = await this.httpService.getUsers(deviceSN, device.getStationSerial());
            if (users !== null) {
                let found = false;
                for (const user of users) {
                    if (user.user_name === username) {
                        station.deleteUser(device, user.user_name, user.short_user_id);
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    this.emit("user error", device, username, new error_1.DeleteUserError("User not found", { context: { device: deviceSN, username: username } }));
                }
            }
            else {
                this.emit("user error", device, username, new error_1.DeleteUserError("Error on getting user list through cloud api call", { context: { device: deviceSN, username: username } }));
            }
        }
        catch (err) {
            const error = (0, error_1.ensureError)(err);
            logging_1.rootAddonLogger.error(`deleteUser error`, { error: (0, utils_2.getError)(error), deviceSN: deviceSN, username: username });
            this.emit("user error", device, username, new error_1.DeleteUserError("Generic error", { cause: error, context: { device: deviceSN, username: username } }));
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
        const station = await this.getStation(device.getStationSerial());
        if (!device.hasCommand(http_1.CommandName.DeviceUpdateUsername)) {
            throw new error_1.NotSupportedError("This functionality is not implemented or supported by this device", { context: { device: deviceSN, commandName: http_1.CommandName.DeviceUpdateUsername, usernmae: username, newUsername: newUsername } });
        }
        try {
            const users = await this.httpService.getUsers(deviceSN, device.getStationSerial());
            if (users !== null) {
                let found = false;
                for (const user of users) {
                    if (user.user_name === username) {
                        if ((device.isLockWifiT8506() || device.isLockWifiT8502() || device.isLockWifiT8510P() || device.isLockWifiT8520P()) && user.password_list.length > 0) {
                            for (const entry of user.password_list) {
                                if (entry.password_type === http_1.UserPasswordType.PIN) {
                                    let schedule = entry.schedule;
                                    if (schedule !== undefined && typeof schedule == "string") {
                                        schedule = JSON.parse(schedule);
                                    }
                                    if (schedule !== undefined && schedule.endDay !== undefined && schedule.endTime !== undefined && schedule.startDay !== undefined && schedule.startTime !== undefined && schedule.week !== undefined) {
                                        station.updateUserSchedule(device, newUsername, user.short_user_id, (0, utils_5.hexStringScheduleToSchedule)(schedule.startDay, schedule.startTime, schedule.endDay, schedule.endTime, schedule.week));
                                    }
                                }
                            }
                        }
                        else if (device.isLockWifiR10() || device.isLockWifiR20()) {
                            for (const entry of user.password_list) {
                                if (entry.password_type === http_1.UserPasswordType.PIN) {
                                    station.updateUsername(device, newUsername, entry.password_id);
                                }
                            }
                        }
                        const result = await this.httpService.updateUser(deviceSN, device.getStationSerial(), user.short_user_id, newUsername);
                        if (result) {
                            this.emit("user username updated", device, username);
                        }
                        else {
                            this.emit("user error", device, username, new error_1.UpdateUserUsernameError("Error in changing username through cloud api call", { context: { device: deviceSN, username: username, newUsername: newUsername } }));
                        }
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    this.emit("user error", device, username, new error_1.UpdateUserUsernameError("User not found", { context: { device: deviceSN, username: username, newUsername: newUsername } }));
                }
            }
            else {
                this.emit("user error", device, username, new error_1.UpdateUserUsernameError("Error on getting user list through cloud api call", { context: { device: deviceSN, username: username, newUsername: newUsername } }));
            }
        }
        catch (err) {
            const error = (0, error_1.ensureError)(err);
            logging_1.rootAddonLogger.error(`updateUser error`, { error: (0, utils_2.getError)(error), deviceSN: deviceSN, username: username, newUsername: newUsername });
            this.emit("user error", device, username, new error_1.UpdateUserUsernameError("Generic error", { cause: error, context: { device: deviceSN, username: username, newUsername: newUsername } }));
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
            throw new error_1.NotSupportedError("This functionality is not implemented or supported by this device", { context: { device: deviceSN, commandName: http_1.CommandName.DeviceUpdateUserPasscode, username: username, passcode: "[redacted]" } });
        }
        try {
            const users = await this.httpService.getUsers(deviceSN, device.getStationSerial());
            if (users !== null) {
                let found = false;
                for (const user of users) {
                    if (user.user_name === username) {
                        for (const entry of user.password_list) {
                            if (entry.password_type === http_1.UserPasswordType.PIN) {
                                station.updateUserPasscode(device, user.user_name, user.short_user_id, passcode);
                                found = true;
                            }
                        }
                    }
                }
                if (!found) {
                    this.emit("user error", device, username, new error_1.UpdateUserPasscodeError("User not found", { context: { device: deviceSN, username: username, passcode: "[redacted]" } }));
                }
            }
            else {
                this.emit("user error", device, username, new error_1.UpdateUserPasscodeError("Error on getting user list through cloud api call"));
            }
        }
        catch (err) {
            const error = (0, error_1.ensureError)(err);
            logging_1.rootAddonLogger.error(`updateUserPasscode error`, { error: (0, utils_2.getError)(error), deviceSN: deviceSN, username: username });
            this.emit("user error", device, username, new error_1.UpdateUserPasscodeError("Generic error", { cause: error, context: { device: deviceSN, username: username, passcode: "[redacted]" } }));
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
        if (!device.hasCommand(http_1.CommandName.DeviceUpdateUserSchedule)) {
            throw new error_1.NotSupportedError("This functionality is not implemented or supported by this device", { context: { device: deviceSN, commandName: http_1.CommandName.DeviceUpdateUserSchedule, usernmae: username, schedule: schedule } });
        }
        try {
            const users = await this.httpService.getUsers(deviceSN, device.getStationSerial());
            if (users !== null) {
                let found = false;
                for (const user of users) {
                    if (user.user_name === username) {
                        station.updateUserSchedule(device, user.user_name, user.short_user_id, schedule);
                        found = true;
                    }
                }
                if (!found) {
                    this.emit("user error", device, username, new error_1.UpdateUserScheduleError("User not found", { context: { device: deviceSN, username: username, schedule: schedule } }));
                }
            }
            else {
                this.emit("user error", device, username, new error_1.UpdateUserScheduleError("Error on getting user list through cloud api call", { context: { device: deviceSN, username: username, schedule: schedule } }));
            }
        }
        catch (err) {
            const error = (0, error_1.ensureError)(err);
            logging_1.rootAddonLogger.error(`updateUserSchedule error`, { error: (0, utils_2.getError)(error), deviceSN: deviceSN, username: username, schedule: schedule });
            this.emit("user error", device, username, new error_1.UpdateUserScheduleError("Generic error", { cause: error, context: { device: deviceSN, username: username, schedule: schedule } }));
        }
    }
}
exports.Stations = Stations;
