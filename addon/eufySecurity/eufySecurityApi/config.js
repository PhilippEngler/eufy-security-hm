"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
const fs_1 = require("fs");
const logging_1 = require("./logging");
const typescript_logging_1 = require("typescript-logging");
const const_1 = require("./http/const");
const utils_1 = require("./http/utils");
class Config {
    configJson;
    hasChanged;
    taskSaveConfig24h;
    /**
     * Constructor, read the config file and provide values to the variables.
     */
    constructor() {
        (0, logging_1.setLoggingLevel)("conf", typescript_logging_1.LogLevel.Info);
        this.hasChanged = false;
        if (this.isConfigFileAvailable() === false) {
            this.configJson = this.createEmptyConfigJson();
            this.hasChanged = true;
        }
        if (this.existUploadedConfig() === true) {
            try {
                this.configJson = this.checkConfigFile(this.loadConfigJson("./config.json.upload"));
                this.hasChanged = true;
                (0, fs_1.unlinkSync)("./config.json.upload");
                logging_1.rootConfLogger.info("Loaded config from uploaded file 'config.json.upload'. This file has now been removed.");
            }
            catch {
                if (this.existUploadedConfig() === true) {
                    (0, fs_1.unlinkSync)("./config.json.upload");
                }
                logging_1.rootConfLogger.info("Error while loading config from uploaded file 'config.json.upload'. This file has now been removed. Going now to load old config.json.");
                if (this.isConfigFileAvailable() === false) {
                    this.configJson = this.createEmptyConfigJson();
                    this.hasChanged = true;
                }
                else {
                    this.configJson = this.loadConfigJson("./config.json");
                }
            }
        }
        else {
            if (this.isConfigFileAvailable() === false) {
                this.configJson = this.createEmptyConfigJson();
                this.hasChanged = true;
            }
            else {
                this.configJson = this.loadConfigJson("./config.json");
            }
        }
        this.checkConfigValues();
        //this.writeConfig(this.configJson);
    }
    /**
     * Writes the given message with the current timestamp to the logfile.
     * @param logLevel The logLevel.
     * @param message The message.
     */
    /*private log(logLevel: string, message: string): void {
        console.log(`${formatDate(Date.now())} ${logLevel.padEnd(5, " ")} [conf]  ${message}`);
    }*/
    /**
     * Remove the scheduling for saveConfig12h
     */
    close() {
        if (this.taskSaveConfig24h) {
            logging_1.rootConfLogger.info(`Remove scheduling for saveConfig24h.`);
            clearInterval(this.taskSaveConfig24h);
        }
    }
    /**
     * Checks if config.json is available.
     * @returns true if config.json is available, otherwise false.
     */
    isConfigFileAvailable() {
        if ((0, fs_1.existsSync)("./config.json")) {
            return true;
        }
        return false;
    }
    /**
     * Checks if a uploaded config.json.upload is available.
     * @returns true, if there is a uploaded config, otherwise false.
     */
    existUploadedConfig() {
        if ((0, fs_1.existsSync)("./config.json.upload")) {
            return true;
        }
        return false;
    }
    /**
     * Specifies the version for the config file expected by the addon.
     * @returns The expected version of the config file.
     */
    getConfigFileTemplateVersion() {
        return 21;
    }
    /**
     * Load the config from the given file and returns the config.
     * @param filePath The parth to the config file.
     * @returns The config.
     */
    loadConfigJson(filePath) {
        let resConfigJson;
        try {
            this.hasChanged = false;
            resConfigJson = JSON.parse((0, fs_1.readFileSync)(filePath, "utf-8"));
            this.taskSaveConfig24h = setInterval(async () => { this.writeConfig(this.configJson); }, (24 * 60 * 60 * 1000));
            if (this.updateConfigNeeded(resConfigJson)) {
                resConfigJson = this.updateConfig(resConfigJson);
            }
        }
        catch (e) {
            logging_1.rootConfLogger.error(`No '${filePath}' available.`);
            logging_1.rootConfLogger.error(JSON.stringify(e));
        }
        return resConfigJson;
    }
    /**
     * Check and add config entries to the config string before parsed.
     * @param filecontent The string to check.
     */
    updateConfigFileTemplateStage1(filecontent) {
        if (filecontent.indexOf("config_file_version") === -1) {
            logging_1.rootConfLogger.info("Configfile needs Stage1 update. Adding 'config_file_version'.");
            filecontent = "[ConfigFileInfo]\r\nconfig_file_version=0\r\n\r\n" + filecontent;
        }
        return filecontent;
    }
    /**
     * Write given config json to file.
     */
    writeConfig(configJson) {
        if (this.hasChanged === true) {
            try {
                (0, fs_1.writeFileSync)("./config.json", JSON.stringify(configJson));
                this.hasChanged = false;
                return "saved";
            }
            catch {
                return "failed";
            }
        }
        else {
            return "ok";
        }
    }
    /**
     * Write given config json to file.
     * @returns A string indicating the success.
     */
    writeCurrentConfig() {
        return this.writeConfig(this.configJson);
    }
    /**
     * Create a empty config object with some default settings.
     * @returns The config object.
     */
    createEmptyConfigJson() {
        const config = JSON.parse(`{}`);
        config.configVersion = this.getConfigFileTemplateVersion();
        const accountData = { "eMail": "", "password": "", "encryptedPassword": "", "userId": "", "nickName": "", "clientPrivateKey": "", "serverPublicKey": "", "country": "DE", "language": "de" };
        config.accountData = accountData;
        const tokenData = { "token": "", "tokenExpires": 0 };
        config.tokenData = tokenData;
        const pushData = { "trustedDeviceName": const_1.PhoneModels[(0, utils_1.randomNumber)(0, const_1.PhoneModels.length)], "serialNumber": "", "eventDurationSeconds": 10, "acceptInvitations": false, "openUdid": "", "fidResponse": "", "checkinResponse": "", "gcmResponseToken": "", "persistentIds": "" };
        config.pushData = pushData;
        const apiConfig = { "httpActive": true, "httpPort": 52789, "httpsActive": true, "httpsPort": 52790, "httpsMethod": "", "httpsPkeyFile": "/usr/local/etc/config/server.pem", "httpsCertFile": "/usr/local/etc/config/server.pem", "httpsPkeyString": "", "houseId": "all", "connectionTypeP2p": 1, "localStaticUdpPortsActive": false, "systemVariableActive": false, "updateCloudInfoIntervall": 10, "updateDeviceDataIntervall": 10, "stateUpdateEventActive": false, "stateUpdateIntervallActive": false, "stateUpdateIntervallTimespan": 15, "pushServiceActive": false, "secureApiAccessBySid": false, "enableEmbeddedPKCS1Support": false };
        config.apiConfig = apiConfig;
        const logConfig = { "logLevelAddon": 2, "logLevelMain": 2, "logLevelHttp": 2, "logLevelP2p": 2, "logLevelPush": 2, "logLevelMqtt": 2 };
        config.logConfig = logConfig;
        const stations = [];
        config.stations = stations;
        const devicePublicKeys = [];
        config.devicePublicKeys = devicePublicKeys;
        const deviceConfig = { "simultaneousDetections": true };
        config.deviceConfig = deviceConfig;
        const interactions = null;
        config.interactions = interactions;
        return config;
    }
    /**
     * Checks if the config file needs to be updated.
     * @param configJson The config as json object.
     * @returns A boolean value, true if the config need to be updated, otherwise false.
     */
    updateConfigNeeded(configJson) {
        if (configJson.configVersion === this.getConfigFileTemplateVersion()) {
            return false;
        }
        return true;
    }
    /**
     * Update the config.json file to the most recent version.
     * @returns true, if the config was updated, otherwise false.
     */
    updateConfig(configJson) {
        if (configJson.configVersion < this.getConfigFileTemplateVersion()) {
            let updated = false;
            if (configJson.configVersion < 12) {
                logging_1.rootConfLogger.info("Configfile needs Stage2 update to version 12...");
                if (configJson.apiConfig.updateCloudInfoIntervall === undefined) {
                    logging_1.rootConfLogger.info(" adding 'updateCloudInfoIntervall'.");
                    configJson.apiConfig.updateCloudInfoIntervall = 10;
                }
                if (configJson.apiConfig.updateDeviceDataIntervall === undefined) {
                    logging_1.rootConfLogger.info(" adding 'updateDeviceDataIntervall'.");
                    configJson.apiConfig.updateDeviceDataIntervall = 10;
                }
                updated = true;
            }
            if (configJson.configVersion < 13) {
                logging_1.rootConfLogger.info("Configfile needs Stage2 update to version 13...");
                if (configJson.apiConfig.houseId === undefined) {
                    logging_1.rootConfLogger.info(" adding 'houseId'.");
                    configJson.apiConfig.houseId = "all";
                }
                updated = true;
            }
            if (configJson.configVersion < 14) {
                logging_1.rootConfLogger.info("Configfile needs Stage2 update to version 14...");
                if (configJson.accountData.userId === undefined) {
                    logging_1.rootConfLogger.info(" adding 'userId'.");
                    configJson.accountData.userId = "";
                }
                if (configJson.accountData.nickName === undefined) {
                    logging_1.rootConfLogger.info(" adding 'nickName'.");
                    configJson.accountData.nickName = "";
                }
                if (configJson.accountData.clientPrivateKey === undefined) {
                    logging_1.rootConfLogger.info(" adding 'clientPrivateKey'.");
                    configJson.accountData.clientPrivateKey = "";
                }
                if (configJson.accountData.serverPublicKey === undefined) {
                    logging_1.rootConfLogger.info(" adding 'serverPublicKey'.");
                    configJson.accountData.serverPublicKey = "";
                }
                updated = true;
            }
            if (configJson.configVersion < 15) {
                logging_1.rootConfLogger.info("Configfile needs Stage2 update to version 15...");
                if (configJson.interactions === undefined) {
                    logging_1.rootConfLogger.info(" adding 'interactions'.");
                    configJson.interactions = null;
                }
                updated = true;
            }
            if (configJson.configVersion < 16) {
                logging_1.rootConfLogger.info("Configfile needs Stage2 update to version 16...");
                if (configJson.logConfig === undefined) {
                    logging_1.rootConfLogger.info(" adding 'logConfig'.");
                    configJson.logConfig = null;
                    const logConfig = { "logLevelAddon": 2, "logLevelMain": 2, "logLevelHttp": 2, "logLevelP2p": 2, "logLevelPush": 2, "logLevelMqtt": 2 };
                    configJson.logConfig = logConfig;
                }
                updated = true;
            }
            if (configJson.configVersion < 17) {
                logging_1.rootConfLogger.info("Configfile needs Stage2 update to version 17...");
                if (configJson.apiConfig.hasOwnProperty("cameraDefaultImage")) {
                    logging_1.rootConfLogger.info(" removing 'cameraDefaultImage'.");
                    updated = true;
                }
                if (configJson.apiConfig.hasOwnProperty("cameraDefaultVideo")) {
                    logging_1.rootConfLogger.info(" removing 'cameraDefaultVideo'.");
                    updated = true;
                }
            }
            if (configJson.configVersion < 18) {
                logging_1.rootConfLogger.info("Configfile needs Stage2 update to version 18...");
                if (configJson.apiConfig.hasOwnProperty("updateLinksActive")) {
                    logging_1.rootConfLogger.info(" removing 'updateLinksActive'.");
                    updated = true;
                }
                if (configJson.apiConfig.hasOwnProperty("updateLinksOnlyWhenArmed")) {
                    logging_1.rootConfLogger.info(" removing 'updateLinksOnlyWhenArmed'.");
                    updated = true;
                }
                if (configJson.apiConfig.hasOwnProperty("updateLinks24hActive")) {
                    logging_1.rootConfLogger.info(" removing 'updateLinks24hActive'.");
                    updated = true;
                }
                if (configJson.apiConfig.hasOwnProperty("updateLinksTimespan")) {
                    logging_1.rootConfLogger.info(" removing 'updateLinksTimespan'.");
                    updated = true;
                }
            }
            if (configJson.configVersion < 19) {
                logging_1.rootConfLogger.info("Configfile needs Stage2 update to version 19...");
                if (configJson.apiConfig.secureApiAccessBySid === undefined) {
                    logging_1.rootConfLogger.info(" adding 'secureApiAccessBySid'.");
                    configJson.apiConfig.secureApiAccessBySid = false;
                }
                updated = true;
            }
            if (configJson.configVersion < 20) {
                logging_1.rootConfLogger.info("Configfile needs Stage2 update to version 20...");
                if (configJson.apiConfig.enableEmbeddedPKCS1Support === undefined) {
                    logging_1.rootConfLogger.info(" adding 'enableEmbeddedPKCS1Support'.");
                    configJson.apiConfig.enableEmbeddedPKCS1Support = false;
                }
                if (configJson.deviceConfig === undefined) {
                    logging_1.rootConfLogger.info(" adding 'deviceConfig'.");
                    configJson.deviceConfig = { simultaneousDetections: true };
                }
                updated = true;
            }
            if (configJson.configVersion < 21) {
                logging_1.rootConfLogger.info("Configfile needs Stage2 update to version 21...");
                if (configJson.interactions !== null) {
                    logging_1.rootConfLogger.info(" changing format of interactions.");
                    configJson.interactions = JSON.parse(configJson.interactions);
                    logging_1.rootConfLogger.info(" adding missing options to interactions...");
                    let interactions = configJson.interactions;
                    for (let deviceSerial in interactions["deviceInteractions"]) {
                        for (let eventInteractionType in interactions["deviceInteractions"][deviceSerial]["eventInteractions"]) {
                            let oldEventInteraction = interactions["deviceInteractions"][deviceSerial]["eventInteractions"][eventInteractionType];
                            if (oldEventInteraction.rejectUnauthorized === undefined) {
                                logging_1.rootConfLogger.info(`  adding 'rejectUnauthorized' to eventInteractionType "${eventInteractionType}" for device ${deviceSerial}.`);
                            }
                            else {
                                logging_1.rootConfLogger.info(`  skipping adding 'rejectUnauthorized' to eventInteractionType "${eventInteractionType}" for device ${deviceSerial}.`);
                            }
                            if (oldEventInteraction.useLocalCertificate === undefined) {
                                logging_1.rootConfLogger.info(`  adding 'useLocalCertificate' to eventInteractionType "${eventInteractionType}" for device ${deviceSerial}.`);
                            }
                            else {
                                logging_1.rootConfLogger.info(`  skipping adding 'useLocalCertificate' to eventInteractionType "${eventInteractionType}" for device ${deviceSerial}.`);
                            }
                            let newEventInteraction = { target: oldEventInteraction.target, useHttps: oldEventInteraction.useHttps, useLocalCertificate: oldEventInteraction.useLocalCertificate === undefined ? false : oldEventInteraction.useLocalCertificate, rejectUnauthorized: oldEventInteraction.rejectUnauthorized === undefined ? true : oldEventInteraction.rejectUnauthorized, user: oldEventInteraction.user, password: oldEventInteraction.password, command: oldEventInteraction.command };
                            interactions["deviceInteractions"][deviceSerial]["eventInteractions"][eventInteractionType] = newEventInteraction;
                        }
                    }
                    logging_1.rootConfLogger.info(" ...done adding missing options to interactions.");
                }
                updated = true;
            }
            if (updated === true) {
                configJson.configVersion = this.getConfigFileTemplateVersion();
                configJson = this.checkConfigFile(configJson);
                this.hasChanged = true;
                this.writeConfig(configJson);
            }
        }
        return configJson;
    }
    /**
     * Create a empty config object with some default settings.
     * @returns The config object.
     */
    checkConfigFile(configJson) {
        const newConfigJson = this.createEmptyConfigJson();
        if (configJson.configVersion !== undefined) {
            newConfigJson.configVersion = configJson.configVersion;
        }
        if (configJson.accountData !== undefined) {
            if (configJson.accountData.eMail !== undefined) {
                newConfigJson.accountData.eMail = configJson.accountData.eMail;
            }
            if (configJson.accountData.password !== undefined) {
                newConfigJson.accountData.password = configJson.accountData.password;
            }
            if (configJson.accountData.encryptedPassword !== undefined) {
                newConfigJson.accountData.encryptedPassword = configJson.accountData.encryptedPassword;
            }
            if (configJson.accountData.userId !== undefined) {
                newConfigJson.accountData.userId = configJson.accountData.userId;
            }
            if (configJson.accountData.nickName !== undefined) {
                newConfigJson.accountData.nickName = configJson.accountData.nickName;
            }
            if (configJson.accountData.clientPrivateKey !== undefined) {
                newConfigJson.accountData.clientPrivateKey = configJson.accountData.clientPrivateKey;
            }
            if (configJson.accountData.serverPublicKey !== undefined) {
                newConfigJson.accountData.serverPublicKey = configJson.accountData.serverPublicKey;
            }
            if (configJson.accountData.country !== undefined) {
                newConfigJson.accountData.country = configJson.accountData.country;
            }
            if (configJson.accountData.language !== undefined) {
                newConfigJson.accountData.language = configJson.accountData.language;
            }
        }
        if (configJson.tokenData !== undefined) {
            if (configJson.tokenData.token !== undefined) {
                newConfigJson.tokenData.token = configJson.tokenData.token;
            }
            if (configJson.tokenData.tokenExpires !== undefined) {
                newConfigJson.tokenData.tokenExpires = configJson.tokenData.tokenExpires;
            }
        }
        if (configJson.pushData !== undefined) {
            if (configJson.pushData.trustedDeviceName !== undefined) {
                newConfigJson.pushData.trustedDeviceName = configJson.pushData.trustedDeviceName;
            }
            if (configJson.pushData.serialNumber !== undefined) {
                newConfigJson.pushData.serialNumber = configJson.pushData.serialNumber;
            }
            if (configJson.pushData.eventDurationSeconds !== undefined) {
                newConfigJson.pushData.eventDurationSeconds = configJson.pushData.eventDurationSeconds;
            }
            if (configJson.pushData.acceptInvitations !== undefined) {
                newConfigJson.pushData.acceptInvitations = configJson.pushData.acceptInvitations;
            }
            if (configJson.pushData.openUdid !== undefined) {
                newConfigJson.pushData.openUdid = configJson.pushData.openUdid;
            }
            if (configJson.pushData.fidResponse !== undefined) {
                newConfigJson.pushData.fidResponse = configJson.pushData.fidResponse;
            }
            if (configJson.pushData.checkinResponse !== undefined) {
                newConfigJson.pushData.checkinResponse = configJson.pushData.checkinResponse;
            }
            if (configJson.pushData.gcmResponseToken !== undefined) {
                newConfigJson.pushData.gcmResponseToken = configJson.pushData.gcmResponseToken;
            }
            if (configJson.pushData.persistentIds !== undefined) {
                newConfigJson.pushData.persistentIds = configJson.pushData.persistentIds;
            }
        }
        if (configJson.apiConfig !== undefined) {
            if (configJson.apiConfig.httpActive !== undefined) {
                newConfigJson.apiConfig.httpActive = configJson.apiConfig.httpActive;
            }
            if (configJson.apiConfig.httpPort !== undefined) {
                newConfigJson.apiConfig.httpPort = configJson.apiConfig.httpPort;
            }
            if (configJson.apiConfig.httpsActive !== undefined) {
                newConfigJson.apiConfig.httpsActive = configJson.apiConfig.httpsActive;
            }
            if (configJson.apiConfig.httpsPort !== undefined) {
                newConfigJson.apiConfig.httpsPort = configJson.apiConfig.httpsPort;
            }
            if (configJson.apiConfig.httpsMethod !== undefined) {
                newConfigJson.apiConfig.httpsMethod = configJson.apiConfig.httpsMethod;
            }
            if (configJson.apiConfig.httpsPkeyFile !== undefined) {
                newConfigJson.apiConfig.httpsPkeyFile = configJson.apiConfig.httpsPkeyFile;
            }
            if (configJson.apiConfig.httpsCertFile !== undefined) {
                newConfigJson.apiConfig.httpsCertFile = configJson.apiConfig.httpsCertFile;
            }
            if (configJson.apiConfig.httpsPkeyString !== undefined) {
                newConfigJson.apiConfig.httpsPkeyString = configJson.apiConfig.httpsPkeyString;
            }
            if (configJson.apiConfig.houseId !== undefined) {
                newConfigJson.apiConfig.houseId = configJson.apiConfig.houseId;
            }
            if (configJson.apiConfig.connectionTypeP2p !== undefined) {
                newConfigJson.apiConfig.connectionTypeP2p = configJson.apiConfig.connectionTypeP2p;
            }
            if (configJson.apiConfig.localStaticUdpPortsActive !== undefined) {
                newConfigJson.apiConfig.localStaticUdpPortsActive = configJson.apiConfig.localStaticUdpPortsActive;
            }
            if (configJson.apiConfig.systemVariableActive !== undefined) {
                newConfigJson.apiConfig.systemVariableActive = configJson.apiConfig.systemVariableActive;
            }
            if (configJson.apiConfig.updateCloudInfoIntervall !== undefined) {
                newConfigJson.apiConfig.updateCloudInfoIntervall = configJson.apiConfig.updateCloudInfoIntervall;
            }
            if (configJson.apiConfig.updateDeviceDataIntervall !== undefined) {
                newConfigJson.apiConfig.updateDeviceDataIntervall = configJson.apiConfig.updateDeviceDataIntervall;
            }
            if (configJson.apiConfig.stateUpdateEventActive !== undefined) {
                newConfigJson.apiConfig.stateUpdateEventActive = configJson.apiConfig.stateUpdateEventActive;
            }
            if (configJson.apiConfig.stateUpdateIntervallActive !== undefined) {
                newConfigJson.apiConfig.stateUpdateIntervallActive = configJson.apiConfig.stateUpdateIntervallActive;
            }
            if (configJson.apiConfig.stateUpdateIntervallTimespan !== undefined) {
                newConfigJson.apiConfig.stateUpdateIntervallTimespan = configJson.apiConfig.stateUpdateIntervallTimespan;
            }
            if (configJson.apiConfig.pushServiceActive !== undefined) {
                newConfigJson.apiConfig.pushServiceActive = configJson.apiConfig.pushServiceActive;
            }
            if (configJson.apiConfig.secureApiAccessBySid !== undefined) {
                newConfigJson.apiConfig.secureApiAccessBySid = configJson.apiConfig.secureApiAccessBySid;
            }
            if (configJson.apiConfig.enableEmbeddedPKCS1Support !== undefined) {
                newConfigJson.apiConfig.enableEmbeddedPKCS1Support = configJson.apiConfig.enableEmbeddedPKCS1Support;
            }
        }
        if (configJson.logConfig !== undefined) {
            if (configJson.logConfig.logLevelAddon !== undefined) {
                newConfigJson.logConfig.logLevelAddon = configJson.logConfig.logLevelAddon;
            }
            if (configJson.logConfig.logLevelMain !== undefined) {
                newConfigJson.logConfig.logLevelMain = configJson.logConfig.logLevelMain;
            }
            if (configJson.logConfig.logLevelHttp !== undefined) {
                newConfigJson.logConfig.logLevelHttp = configJson.logConfig.logLevelHttp;
            }
            if (configJson.logConfig.logLevelP2p !== undefined) {
                newConfigJson.logConfig.logLevelP2p = configJson.logConfig.logLevelP2p;
            }
            if (configJson.logConfig.logLevelPush !== undefined) {
                newConfigJson.logConfig.logLevelPush = configJson.logConfig.logLevelPush;
            }
            if (configJson.logConfig.logLevelMqtt !== undefined) {
                newConfigJson.logConfig.logLevelMqtt = configJson.logConfig.logLevelMqtt;
            }
        }
        if (configJson.stations !== undefined) {
            newConfigJson.stations = configJson.stations;
        }
        if (configJson.deviceConfig !== undefined) {
            newConfigJson.deviceConfig = configJson.deviceConfig;
        }
        if (configJson.interactions !== undefined) {
            newConfigJson.interactions = configJson.interactions;
        }
        return newConfigJson;
    }
    checkConfigValues() {
        let updated = false;
        if (this.configJson.apiConfig.httpActive === true && (this.configJson.apiConfig.httpPort < 1 || this.configJson.httpPort > 65535)) {
            logging_1.rootConfLogger.info(`Set httpPort to default value "52789"`);
            this.configJson.apiConfig.httpPort = 52789;
            updated = true;
        }
        if (this.configJson.apiConfig.httpsActive === true && (this.configJson.apiConfig.httpsPort < 1 || this.configJson.apiConfig.httpsPort > 65535)) {
            logging_1.rootConfLogger.info(`Set httpsPort to default value "52790"`);
            this.configJson.apiConfig.httpsPort = 52790;
            updated = true;
        }
        if (this.configJson.apiConfig.httpActive === true && this.configJson.apiConfig.httpsActive === true && this.configJson.apiConfig.httpPort === this.configJson.apiConfig.httpsPort) {
            logging_1.rootConfLogger.info(`Set httpPort to default value "52789" and httpsPort to default value "52790"`);
            this.configJson.apiConfig.httpPort = 52789;
            this.configJson.apiConfig.httpsPort = 52790;
            updated = true;
        }
        /*if (this.configJson.apiConfig.localStaticUdpPortsActive === true) {
            var udpPorts = [];
            var stations = this.configJson.stations;
            if (stations.length > 2) {
                for (var station in stations) {
                    if (udpPorts[this.configJson.stations[station].udpPort] === undefined) {
                        udpPorts[this.configJson.stations[station].udpPort] = this.configJson.stations[station].udpPort;
                    } else {
                        rootConfLogger.info(`Set localStaticUdpPortsActive to default value "false". Please check updPorts for stations, they must be unique.`);
                        this.configJson.localStaticUdpPortsActive = false;
                        updated = true;
                    }
                }
            }
        }*/
        if (this.configJson.apiConfig.updateCloudInfoIntervall !== 0 && (this.configJson.apiConfig.updateCloudInfoIntervall < 10 || this.configJson.apiConfig.updateCloudInfoIntervall > 240)) {
            logging_1.rootConfLogger.info(`Set updateCloudInfoIntervall to default value "10"`);
            this.configJson.apiConfig.updateCloudInfoIntervall = 10;
            updated = true;
        }
        if (this.configJson.apiConfig.updateDeviceDataIntervall !== 0 && (this.configJson.apiConfig.updateDeviceDataIntervall < 10 || this.configJson.apiConfig.updateDeviceDataIntervall > 240)) {
            logging_1.rootConfLogger.info(`Set updateDeviceDataIntervall to default value "10"`);
            this.configJson.apiConfig.updateDeviceDataIntervall = 10;
            updated = true;
        }
        if (this.configJson.apiConfig.stateUpdateIntervallActive && (this.configJson.apiConfig.stateUpdateIntervallTimespan < 15 || this.configJson.apiConfig.stateUpdateIntervallTimespan > 240)) {
            logging_1.rootConfLogger.info(`Set stateUpdateIntervallTimespan to default value "15"`);
            this.configJson.apiConfig.stateUpdateIntervallTimespan = 15;
            updated = true;
        }
        if (this.configJson.logConfig.logLevelAddon < 0 || this.configJson.logConfig.logLevelAddon > 6) {
            logging_1.rootConfLogger.info(`Set logLevelAddon to default value "2"`);
            this.configJson.logConfig.logLevelAddon = 2;
            updated = true;
        }
        if (this.configJson.logConfig.logLevelMain < 0 || this.configJson.logConfig.logLevelMain > 6) {
            logging_1.rootConfLogger.info(`Set logLevelMain to default value "2"`);
            this.configJson.logConfig.logLevelMain = 2;
            updated = true;
        }
        if (this.configJson.logConfig.logLevelHttp < 0 || this.configJson.logConfig.logLevelHttp > 6) {
            logging_1.rootConfLogger.info(`Set logLevelHttp to default value "2"`);
            this.configJson.logConfig.logLevelHttp = 2;
            updated = true;
        }
        if (this.configJson.logConfig.logLevelP2p < 0 || this.configJson.logConfig.logLevelP2p > 6) {
            logging_1.rootConfLogger.info(`Set logLevelP2p to default value "2"`);
            this.configJson.logConfig.logLevelP2p = 2;
            updated = true;
        }
        if (this.configJson.logConfig.logLevelPush < 0 || this.configJson.logConfig.logLevelPush > 6) {
            logging_1.rootConfLogger.info(`Set logLevelPush to default value "2"`);
            this.configJson.logConfig.logLevelPush = 2;
            updated = true;
        }
        if (this.configJson.logConfig.logLevelMqtt < 0 || this.configJson.logConfig.logLevelMqtt > 6) {
            logging_1.rootConfLogger.info(`Set logLevelMqtt to default value "2"`);
            this.configJson.logConfig.logLevelMqtt = 2;
            updated = true;
        }
        if (updated === true) {
            this.hasChanged = true;
        }
        return updated;
    }
    /**
     * Add section for a new station.
     * @param stationSerial Serialnumber of the new station.
     */
    updateWithNewStation(stationSerial) {
        logging_1.rootConfLogger.info(`Adding station ${stationSerial} to settings.`);
        const station = { "stationSerial": stationSerial, "p2pDid": null, "stationIpAddress": null, "udpPort": null };
        if (Array.isArray(this.configJson.stations)) {
            this.configJson.stations.push(station);
        }
        else {
            const stations = [];
            stations.push(station);
            this.configJson.stations = stations;
        }
        this.hasChanged = true;
        return true;
    }
    /**
     * Checks if the station given by serialnumber is in the config.
     * @param stationSerial The serial of the station to check.
     */
    isStationInConfig(stationSerial) {
        if (Array.isArray(this.configJson.stations)) {
            let station;
            for (station in this.configJson.stations) {
                if (this.configJson.stations[station] !== undefined && this.configJson.stations[station].stationSerial === stationSerial) {
                    return true;
                }
            }
        }
        return false;
    }
    /**
     * Get the iterator to access the station in the json object.
     * @param stationSerial The serial of the station.
     * @returns The iterator.
     */
    getStationIterator(stationSerial) {
        if (Array.isArray(this.configJson.stations)) {
            let station;
            for (station in this.configJson.stations) {
                if (this.configJson.stations[station] !== undefined && this.configJson.stations[station].stationSerial === stationSerial) {
                    return station;
                }
            }
        }
        return undefined;
    }
    /**
     * Get the version of the configfile.
     * @returns The configfile version as string.
     */
    getConfigFileVersion() {
        if (this.configJson.configVersion !== undefined) {
            return this.configJson.configVersion;
        }
        else {
            return "";
        }
    }
    /**
     * Get the eMail address of the eufy security account.
     */
    getEmailAddress() {
        if (this.configJson.accountData.eMail !== undefined) {
            return this.configJson.accountData.eMail;
        }
        else {
            return "";
        }
    }
    /**
     * Set the eMail address for the eufy security account.
     * @param email The eMail address to set.
     */
    setEmailAddress(eMail) {
        if (this.configJson.accountData.eMail !== eMail) {
            this.configJson.accountData.eMail = eMail;
            this.setToken("");
            this.hasChanged = true;
        }
    }
    /**
     * Get the user id of the eufy security account.
     */
    getUserId() {
        if (this.configJson.accountData.userId !== undefined) {
            return this.configJson.accountData.userId;
        }
        else {
            return "";
        }
    }
    /**
     * Set the user id for the eufy security account.
     * @param userId The user id to set.
     */
    setUserId(userId) {
        if (this.configJson.accountData.userId !== userId) {
            this.configJson.accountData.userId = userId;
            this.hasChanged = true;
        }
    }
    /**
     * Get the password for the eufy security account.
     */
    getPassword() {
        if (this.configJson.accountData.password !== undefined) {
            return this.configJson.accountData.password;
        }
        else {
            return "";
        }
    }
    /**
     * Set the passwort for the eufy security account.
     * @param password The password to set.
     */
    setPassword(password) {
        if (this.configJson.accountData.password !== password) {
            this.configJson.accountData.password = password;
            this.hasChanged = true;
        }
    }
    /**
     * Get the nickname of the eufy security account.
     */
    getNickName() {
        if (this.configJson.accountData.nickName !== undefined) {
            return this.configJson.accountData.nickName;
        }
        else {
            return "";
        }
    }
    /**
     * Set the nickname for the eufy security account.
     * @param nickName The nickname to set.
     */
    setNickName(nickName) {
        if (this.configJson.accountData.nickName !== nickName) {
            this.configJson.accountData.nickName = nickName;
            this.hasChanged = true;
        }
    }
    /**
     * Get the client private key of the eufy security account.
     */
    getClientPrivateKey() {
        if (this.configJson.accountData.clientPrivateKey !== undefined) {
            return this.configJson.accountData.clientPrivateKey;
        }
        else {
            return "";
        }
    }
    /**
     * Set the client private key for the eufy security account.
     * @param clientPrivateKey The client private key to set.
     */
    setClientPrivateKey(clientPrivateKey) {
        if (this.configJson.accountData.clientPrivateKey !== clientPrivateKey) {
            this.configJson.accountData.clientPrivateKey = clientPrivateKey;
            this.hasChanged = true;
        }
    }
    /**
     * Get the server public key of the eufy security account.
     */
    getServerPublicKey() {
        if (this.configJson.accountData.serverPublicKey !== undefined) {
            return this.configJson.accountData.serverPublicKey;
        }
        else {
            return "";
        }
    }
    /**
     * Set the server public key for the eufy security account.
     * @param serverPublicKey The server public key to set.
     */
    setServerPublicKey(serverPublicKey) {
        if (this.configJson.accountData.serverPublicKey !== serverPublicKey) {
            this.configJson.accountData.serverPublicKey = serverPublicKey;
            this.hasChanged = true;
        }
    }
    /**
     * Get the devices public keys of the eufy security account.
     */
    getDevicePublicKeys() {
        if (this.configJson.devicePublicKeys !== undefined) {
            return this.configJson.devicePublicKeys;
        }
        else {
            return "";
        }
    }
    /**
     * Set the device public keys for the eufy security account.
     * @param devicePublicKeys The device public keys to set.
     */
    setDevicePublicKeys(devicePublicKeys) {
        if (JSON.stringify(this.configJson.devicePublicKeys) !== JSON.stringify(devicePublicKeys)) {
            this.configJson.devicePublicKeys = devicePublicKeys;
            this.hasChanged = true;
        }
    }
    /**
     * Returns true if the connection type for connecting with station.
     */
    getConnectionType() {
        if (this.configJson.apiConfig.connectionTypeP2p !== undefined) {
            return this.configJson.apiConfig.connectionTypeP2p;
        }
        else {
            return -1;
        }
    }
    /**
     * Sets true, if static udp ports should be used otherwise false.
     * @param connectionTypeP2p Boolean value.
     */
    setConnectionType(connectionTypeP2p) {
        if (this.configJson.apiConfig.connectionTypeP2p !== connectionTypeP2p) {
            this.configJson.apiConfig.connectionTypeP2p = connectionTypeP2p;
            this.hasChanged = true;
        }
    }
    /**
     * Returns true if the static udp ports should be used otherwise false.
     */
    getLocalStaticUdpPortsActive() {
        if (this.configJson.apiConfig.localStaticUdpPortsActive !== undefined) {
            return this.configJson.apiConfig.localStaticUdpPortsActive;
        }
        else {
            return false;
        }
    }
    /**
     * Sets true, if static udp ports should be used otherwise false.
     * @param localStaticUdpPortsActive Boolean value.
     */
    setLocalStaticUdpPortsActive(localStaticUdpPortsActive) {
        if (this.configJson.apiConfig.localStaticUdpPortsActive !== localStaticUdpPortsActive) {
            this.configJson.apiConfig.localStaticUdpPortsActive = localStaticUdpPortsActive;
            this.hasChanged = true;
        }
    }
    /**
     * Set the udp static ports for local communication.
     * @param ports A string with the ports splitted by a comma.
     */
    setLocalStaticUdpPorts(ports) {
        let done = false;
        if (ports) {
            for (const array of ports) {
                let portNumber;
                if (array[1] === null) {
                    portNumber = null;
                }
                else {
                    portNumber = Number.parseInt(array[1]);
                }
                if (this.setLocalStaticUdpPortPerStation(array[0], portNumber) === true) {
                    done = true;
                }
            }
        }
        return done;
    }
    /**
     * Get a boolean value if the api shoud set system variables on the CCU.
     */
    getSystemVariableActive() {
        if (this.configJson.apiConfig.systemVariableActive !== undefined) {
            return this.configJson.apiConfig.systemVariableActive;
        }
        else {
            return false;
        }
    }
    /**
     * Set a boolean value if the api shoud set system variables on the CCU.
     * @param systemVariableActive Set system variables on the CCU.
     */
    setSystemVariableActive(systemVariableActive) {
        if (this.configJson.apiConfig.systemVariableActive !== systemVariableActive) {
            this.configJson.apiConfig.systemVariableActive = systemVariableActive;
            this.hasChanged = true;
        }
    }
    /**
     * Get weather http should be used for api.
     */
    getHttpActive() {
        if (this.configJson.apiConfig.httpActive !== undefined) {
            return this.configJson.apiConfig.httpActive;
        }
        else {
            return false;
        }
    }
    /**
     * Set weather http sould be used for api.
     * @param httpActive Use http for the api.
     */
    setHttpActive(httpActive) {
        if (this.configJson.apiConfig.httpActive !== httpActive) {
            this.configJson.apiConfig.httpActive = httpActive;
            this.hasChanged = true;
        }
    }
    /**
     * Get the port for the webserver (HTTP) for the api.
     */
    getHttpPort() {
        if (this.configJson.apiConfig.httpPort !== undefined) {
            return this.configJson.apiConfig.httpPort;
        }
        else {
            return 0;
        }
    }
    /**
     * Set the port for the webserver (HTTP) for the api.
     * @param httpPort The port the api should be accessable.
     */
    setHttpPort(httpPort) {
        if (this.configJson.apiConfig.httpPort !== httpPort) {
            this.configJson.apiConfig.httpPort = httpPort;
            this.hasChanged = true;
        }
    }
    /**
     * Get weather https should be used for api.
     */
    getHttpsActive() {
        if (this.configJson.apiConfig.httpsActive !== undefined) {
            return this.configJson.apiConfig.httpsActive;
        }
        else {
            return false;
        }
    }
    /**
     * Set weather https sould be used for api.
     * @param httpsActive Use https for the api.
     */
    setHttpsActive(httpsActive) {
        if (this.configJson.apiConfig.httpsActive !== httpsActive) {
            this.configJson.apiConfig.httpsActive = httpsActive;
            this.hasChanged = true;
        }
    }
    /**
     * Get the port for the webserver (HTTPS) for the api.
     */
    getHttpsPort() {
        if (this.configJson.apiConfig.httpsPort !== undefined) {
            return this.configJson.apiConfig.httpsPort;
        }
        else {
            return 0;
        }
    }
    /**
     * Set the port for the webserver (HTTPS) for the api.
     * @param httpsPort The port the api should be accessable.
     */
    setHttpsPort(httpsPort) {
        if (this.configJson.apiConfig.httpsPort !== httpsPort) {
            this.configJson.apiConfig.httpsPort = httpsPort;
            this.hasChanged = true;
        }
    }
    /**
     * Returns the method used for https.
     */
    getHttpsMethod() {
        if (this.configJson.apiConfig.httpsMethod !== undefined) {
            return this.configJson.apiConfig.httpsMethod;
        }
        else {
            return "";
        }
    }
    /**
     * Set the method used for https.
     * @param httpsMethod The method for https.
     */
    setHttpsMethod(httpsMethod) {
        if (this.configJson.apiConfig.httpsMethod !== httpsMethod) {
            this.configJson.apiConfig.httpsMethod = httpsMethod;
            this.hasChanged = true;
        }
    }
    /**
     * Get the key for https.
     */
    getHttpsPKeyFile() {
        if (this.configJson.apiConfig.httpsPkeyFile !== undefined) {
            return this.configJson.apiConfig.httpsPkeyFile;
        }
        else {
            return "";
        }
    }
    /**
     * Set the key for https.
     * @param httpsPkeyFile The path to the key file for https.
     */
    setHttpsPKeyFile(httpsPkeyFile) {
        if (this.configJson.apiConfig.httpsPKeyFile !== httpsPkeyFile) {
            this.configJson.apiConfig.httpsPKeyFile = httpsPkeyFile;
            this.hasChanged = true;
        }
    }
    /**
     * Returns the cert file for https.
     */
    getHttpsCertFile() {
        if (this.configJson.apiConfig.httpsCertFile !== undefined) {
            return this.configJson.apiConfig.httpsCertFile;
        }
        else {
            return "";
        }
    }
    /**
     * Set the cert for https.
     * @param httpsCertFile The cert file for https.
     */
    setHttpsCertFile(httpsCertFile) {
        if (this.configJson.apiConfig.httpsCertFile !== httpsCertFile) {
            this.configJson.apiConfig.httpsCertFile = httpsCertFile;
            this.hasChanged = true;
        }
    }
    /**
     * Get the key as string for https.
     */
    getHttpsPkeyString() {
        if (this.configJson.apiConfig.httpsPkeyString !== undefined) {
            return this.configJson.apiConfig.httpsPkeyString;
        }
        else {
            return "";
        }
    }
    /**
     * Set the houseId for filtering station and devices.
     * @param houseId The id for the house as string.
     */
    setHouseId(houseId) {
        if (this.configJson.apiConfig.houseId !== houseId) {
            this.configJson.apiConfig.houseId = houseId;
            this.hasChanged = true;
        }
    }
    /**
     * Get the houseId as string for filtering stations and devices.
     */
    getHouseId() {
        if (this.configJson.apiConfig.houseId !== undefined) {
            return this.configJson.apiConfig.houseId;
        }
        else {
            return "all";
        }
    }
    /**
     * Set the key as string for https.
     * @param httpsPkeyString The key for https as string.
     */
    setHttpsPkeyString(httpsPkeyString) {
        if (this.configJson.apiConfig.httpsPkeyString !== httpsPkeyString) {
            this.configJson.apiConfig.httpsPkeyString = httpsPkeyString;
            this.hasChanged = true;
        }
    }
    /**
     * Get the timespan intervall for retrieving data from the cloud.
     * @returns The timespan duration as number.
     */
    getUpdateCloudInfoIntervall() {
        if (this.configJson.apiConfig.updateCloudInfoIntervall !== undefined) {
            return this.configJson.apiConfig.updateCloudInfoIntervall;
        }
        else {
            return 10;
        }
    }
    /**
     * Set the timespan intervall for retrieving data from the cloud.
     * @param updateCloudInfoIntervall The timespan duration as number.
     */
    setUpdateCloudInfoIntervall(updateCloudInfoIntervall) {
        if (this.configJson.apiConfig.updateCloudInfoIntervall !== updateCloudInfoIntervall) {
            this.configJson.apiConfig.updateCloudInfoIntervall = updateCloudInfoIntervall;
            this.hasChanged = true;
        }
    }
    /**
     * Get the timespan intervall for retrieving device data.
     * @returns The timespan duration as number.
     */
    getUpdateDeviceDataIntervall() {
        if (this.configJson.apiConfig.updateDeviceDataIntervall !== undefined) {
            return this.configJson.apiConfig.updateDeviceDataIntervall;
        }
        else {
            return 10;
        }
    }
    /**
     * Set the timespan intervall for retrieving device data.
     * @param updateDeviceDataIntervall The timespan duration as number.
     */
    setUpdateDeviceDataIntervall(updateDeviceDataIntervall) {
        if (this.configJson.apiConfig.updateDeviceDataIntervall !== updateDeviceDataIntervall) {
            this.configJson.apiConfig.updateDeviceDataIntervall = updateDeviceDataIntervall;
            this.hasChanged = true;
        }
    }
    /**
     * Determines if the updated state runs by event.
     */
    getStateUpdateEventActive() {
        if (this.configJson.apiConfig.stateUpdateEventActive !== undefined) {
            return this.configJson.apiConfig.stateUpdateEventActive;
        }
        else {
            return false;
        }
    }
    /**
     * Set the value for update state eventbased.
     * @param stateUpdateEventActive The value if the state should updated eventbased.
     */
    setStateUpdateEventActive(stateUpdateEventActive) {
        if (this.configJson.apiConfig.stateUpdateEventActive !== stateUpdateEventActive) {
            this.configJson.apiConfig.stateUpdateEventActive = stateUpdateEventActive;
            this.hasChanged = true;
        }
    }
    /**
     * Determines if the updated state runs scheduled.
     */
    getStateUpdateIntervallActive() {
        if (this.configJson.apiConfig.stateUpdateIntervallActive !== undefined) {
            return this.configJson.apiConfig.stateUpdateIntervallActive;
        }
        else {
            return false;
        }
    }
    /**
     * Set the value for update state scheduled.
     * @param stateUpdateIntervallActive The value if the state should updated scheduled.
     */
    setStateUpdateIntervallActive(stateUpdateIntervallActive) {
        if (this.configJson.apiConfig.stateUpdateIntervallActive !== stateUpdateIntervallActive) {
            this.configJson.apiConfig.stateUpdateIntervallActive = stateUpdateIntervallActive;
            this.hasChanged = true;
        }
    }
    /**
     * Returns the time between runs of two scheduled tasks for update state.
     */
    getStateUpdateIntervallTimespan() {
        if (this.configJson.apiConfig.stateUpdateIntervallTimespan !== undefined) {
            return this.configJson.apiConfig.stateUpdateIntervallTimespan;
        }
        else {
            return 15;
        }
    }
    /**
     * Set the value for the time between runs of two scheduled tasks for update state.
     * @param stateUpdateIntervallTimespan The time in minutes.
     */
    setStateUpdateIntervallTimespan(stateUpdateIntervallTimespan) {
        if (this.configJson.apiConfig.stateUpdateIntervallTimespan !== stateUpdateIntervallTimespan) {
            this.configJson.apiConfig.stateUpdateIntervallTimespan = stateUpdateIntervallTimespan;
            this.hasChanged = true;
        }
    }
    /**
     * Returns the log level for addon.
     */
    getLogLevelAddon() {
        if (this.configJson.logConfig.logLevelAddon !== undefined) {
            return this.configJson.logConfig.logLevelAddon;
        }
        else {
            return 0;
        }
    }
    /**
     * Set the log level for addon.
     * @param logLevel The log level as number to set
     */
    setLogLevelAddon(logLevel) {
        if (this.configJson.logConfig.logLevelAddon !== logLevel) {
            this.configJson.logConfig.logLevelAddon = logLevel;
            (0, logging_1.setLoggingLevel)("addon", logLevel);
            this.hasChanged = true;
        }
    }
    /**
     * Returns the log level for main.
     */
    getLogLevelMain() {
        if (this.configJson.logConfig.logLevelMain !== undefined) {
            return this.configJson.logConfig.logLevelMain;
        }
        else {
            return 0;
        }
    }
    /**
     * Set the log level for main.
     * @param logLevel The log level as number to set
     */
    setLogLevelMain(logLevel) {
        if (this.configJson.logConfig.logLevelMain !== logLevel) {
            this.configJson.logConfig.logLevelMain = logLevel;
            (0, logging_1.setLoggingLevel)("main", logLevel);
            this.hasChanged = true;
        }
    }
    /**
     * Returns the log level for http.
     */
    getLogLevelHttp() {
        if (this.configJson.logConfig.logLevelHttp !== undefined) {
            return this.configJson.logConfig.logLevelHttp;
        }
        else {
            return 0;
        }
    }
    /**
     * Set the log level for http.
     * @param logLevel The log level as number to set
     */
    setLogLevelHttp(logLevel) {
        if (this.configJson.logConfig.logLevelHttp !== logLevel) {
            this.configJson.logConfig.logLevelHttp = logLevel;
            (0, logging_1.setLoggingLevel)("http", logLevel);
            this.hasChanged = true;
        }
    }
    /**
     * Returns the log level for p2p.
     */
    getLogLevelP2p() {
        if (this.configJson.logConfig.logLevelP2p !== undefined) {
            return this.configJson.logConfig.logLevelP2p;
        }
        else {
            return 0;
        }
    }
    /**
     * Set the log level for p2p.
     * @param logLevel The log level as number to set
     */
    setLogLevelP2p(logLevel) {
        if (this.configJson.logConfig.logLevelP2p !== logLevel) {
            this.configJson.logConfig.logLevelP2p = logLevel;
            (0, logging_1.setLoggingLevel)("p2p", logLevel);
            this.hasChanged = true;
        }
    }
    /**
     * Returns the log level for push.
     */
    getLogLevelPush() {
        if (this.configJson.logConfig.logLevelPush !== undefined) {
            return this.configJson.logConfig.logLevelPush;
        }
        else {
            return 0;
        }
    }
    /**
     * Set the log level for push.
     * @param logLevel The log level as number to set
     */
    setLogLevelPush(logLevel) {
        if (this.configJson.logConfig.logLevelPush !== logLevel) {
            this.configJson.logConfig.logLevelPush = logLevel;
            (0, logging_1.setLoggingLevel)("push", logLevel);
            this.hasChanged = true;
        }
    }
    /**
     * Returns the log level for mqtt.
     */
    getLogLevelMqtt() {
        if (this.configJson.logConfig.logLevelMqtt !== undefined) {
            return this.configJson.logConfig.logLevelMqtt;
        }
        else {
            return 0;
        }
    }
    /**
     * Set the log level for mqtt.
     * @param logLevel The log level as number to set
     */
    setLogLevelMqtt(logLevel) {
        if (this.configJson.logConfig.logLevelMqtt !== logLevel) {
            this.configJson.logConfig.logLevelMqtt = logLevel;
            (0, logging_1.setLoggingLevel)("mqtt", logLevel);
            this.hasChanged = true;
        }
    }
    /**
     * Get the token for login to the eufy security account.
     */
    getToken() {
        if (this.configJson.tokenData.token !== undefined) {
            return this.configJson.tokenData.token;
        }
        else {
            return "";
        }
    }
    /**
     * Set the token for login to the eufy security account.
     * @param token The token for login.
     */
    setToken(token) {
        if (this.configJson.tokenData.token !== token) {
            if (token === undefined) {
                token = "";
            }
            this.configJson.tokenData.token = token;
            this.hasChanged = true;
        }
    }
    /**
     * Get the timestamp the token expires.
     */
    getTokenExpire() {
        if (this.configJson.tokenData.tokenExpires !== undefined) {
            return this.configJson.tokenData.tokenExpires;
        }
        else {
            return 0;
        }
    }
    /**
     * Set the timestamp the token expires.
     * @param tokenexpire The time the token expires.
     */
    setTokenExpire(tokenexpire) {
        if (this.configJson.tokenData.tokenExpires !== tokenexpire) {
            if (tokenexpire === undefined) {
                tokenexpire = 0;
            }
            this.configJson.tokenData.tokenExpires = tokenexpire;
            this.hasChanged = true;
        }
    }
    /**
     * Get the P2P_DID for the given station.
     * @param stationSerial The serialnumber of the station.
     */
    getP2PDataP2pDid(stationSerial) {
        const station = this.getStationIterator(stationSerial);
        if (station !== undefined && this.configJson.stations !== undefined && this.configJson.stations[station] !== undefined && this.configJson.stations[station].p2pDid !== undefined) {
            return this.configJson.stations[station].p2pDid;
        }
        else {
            return "";
        }
    }
    /**
     * Set the P2P_DID for the given station.
     * @param stationSerial The serialnumber of the station.
     * @param p2p_did The P2P_DID to set.
     */
    setP2PDataP2pDid(stationSerial, p2pDid) {
        const station = this.getStationIterator(stationSerial);
        if (station !== undefined) {
            if (this.configJson.stations[station].p2pDid !== p2pDid) {
                this.configJson.stations[station].p2pDid = p2pDid;
                this.hasChanged = true;
            }
        }
    }
    /**
     * Get the local ip address of the station.
     * @param stationSerial The serialnumber of the station.
     */
    getP2PDataStationIpAddress(stationSerial) {
        const station = this.getStationIterator(stationSerial);
        if (station !== undefined && this.configJson.stations !== undefined && this.configJson.stations[station] !== undefined && this.configJson.stations[station].stationIpAddress !== undefined) {
            return this.configJson.stations[station].stationIpAddress;
        }
        else {
            return "";
        }
    }
    /**
     * Set the local ip address of the given station.
     * @param stationSerial The serialnumber of the station.
     * @param stationIpAddress The local ip address.
     */
    setP2PDataStationIpAddress(stationSerial, stationIpAddress) {
        const station = this.getStationIterator(stationSerial);
        if (station !== undefined) {
            if (this.configJson.stations[station].stationIpAddress !== stationIpAddress) {
                this.configJson.stations[station].stationIpAddress = stationIpAddress;
                this.hasChanged = true;
            }
        }
    }
    /**
     * Returns the UDP port for the station.
     * @param stationSerial The serial of the station.
     * @returns The UDP port for the station.
     */
    getLocalStaticUdpPortPerStation(stationSerial) {
        const station = this.getStationIterator(stationSerial);
        if (station !== undefined && this.configJson.stations !== undefined && this.configJson.stations[station] !== undefined && this.configJson.stations[station].udpPort !== undefined && this.configJson.stations[station].udpPort !== null) {
            return this.configJson.stations[station].udpPort;
        }
        else {
            return null;
        }
    }
    /**
     * Set the UDP port for a station.
     * @param stationSerial The serial for the station.
     * @param udpPort The UDP port.
     * @returns True on success otherwise false.
     */
    setLocalStaticUdpPortPerStation(stationSerial, udpPort) {
        if (stationSerial !== undefined) {
            let res;
            if (this.isStationInConfig(stationSerial) === false) {
                logging_1.rootConfLogger.info(`Station ${stationSerial} not in config. Try to create new station entry.`);
                res = this.updateWithNewStation(stationSerial);
            }
            else {
                res = true;
            }
            if (res) {
                res = false;
                const station = this.getStationIterator(stationSerial);
                if (station !== undefined) {
                    if (udpPort === undefined) {
                        udpPort = null;
                        return true;
                    }
                    if (this.configJson.stations[station].udpPort !== udpPort) {
                        this.configJson.stations[station].udpPort = udpPort;
                        this.hasChanged = true;
                        return true;
                    }
                    else {
                        return false;
                    }
                }
                logging_1.rootConfLogger.info(`Station ${stationSerial} not in config.`);
                return false;
            }
            else {
                logging_1.rootConfLogger.error(`Station ${stationSerial} not in config. Create new station entry failed.`);
                return false;
            }
        }
        logging_1.rootConfLogger.info(`No stationSerial given`);
        return false;
    }
    /**
     * Saves the P2P releated data for a given station. If the station is currently not in config, it will be created before the config data is populated.
     * The config data will be saved and the config is reloaded.
     * @param stationSerial The serialnumber of the station
     * @param p2pDid The P2P_DID for the P2P connection
     * @param station_ip_address The local ip address of the station
     */
    setP2PData(stationSerial, p2pDid, station_ip_address) {
        let res;
        if (this.isStationInConfig(stationSerial) === false) {
            res = this.updateWithNewStation(stationSerial);
        }
        else {
            res = true;
        }
        if (res) {
            if (p2pDid !== undefined) {
                this.setP2PDataP2pDid(stationSerial, p2pDid);
            }
            if (station_ip_address !== undefined) {
                this.setP2PDataStationIpAddress(stationSerial, station_ip_address.toString());
            }
            if (p2pDid !== undefined || station_ip_address !== undefined) {
                this.writeConfig(this.configJson);
            }
        }
    }
    /**
     * Get the value for enableing or disableing push service.
     * @returns Boolean for enableing or disableing.
     */
    getPushServiceActive() {
        if (this.configJson.apiConfig.pushServiceActive !== undefined) {
            return this.configJson.apiConfig.pushServiceActive;
        }
        else {
            return false;
        }
    }
    /**
     * Set if push service is used.
     * @param pushServiceActive The value if push service is used.
     */
    setPushServiceActive(pushServiceActive) {
        if (this.configJson.apiConfig.pushServiceActive !== pushServiceActive) {
            this.configJson.apiConfig.pushServiceActive = pushServiceActive;
            this.hasChanged = true;
        }
    }
    /**
     * Get the value for securing the access to api by sid.
     * @returns Boolean for enableing or disableing.
     */
    getSecureApiAccessBySid() {
        if (this.configJson.apiConfig.secureApiAccessBySid !== undefined) {
            return this.configJson.apiConfig.secureApiAccessBySid;
        }
        else {
            return false;
        }
    }
    /**
     * Set if securing api access by sid is used.
     * @param secureApiAccessBySid The value if securing api access by sid is used.
     */
    setSecureApiAccessBySid(secureApiAccessBySid) {
        if (this.configJson.apiConfig.secureApiAccessBySid !== secureApiAccessBySid) {
            this.configJson.apiConfig.secureApiAccessBySid = secureApiAccessBySid;
            this.hasChanged = true;
        }
    }
    /**
     * Get the value for enable embedded PKCS1 support.
     * @returns Boolean for enableing or disableing.
     */
    getEnableEmbeddedPKCS1Support() {
        if (this.configJson.apiConfig.enableEmbeddedPKCS1Support !== undefined) {
            return this.configJson.apiConfig.enableEmbeddedPKCS1Support;
        }
        else {
            return false;
        }
    }
    /**
     * Set if enableing embedded PKCS1 support.
     * @param enableEmbeddedPKCS1Support The value if securing api access by sid is used.
     */
    setEnableEmbeddedPKCS1Support(enableEmbeddedPKCS1Support) {
        if (this.configJson.apiConfig.enableEmbeddedPKCS1Support !== enableEmbeddedPKCS1Support) {
            this.configJson.apiConfig.enableEmbeddedPKCS1Support = enableEmbeddedPKCS1Support;
            this.hasChanged = true;
        }
    }
    /**
     * Get the trusted device name for push connection.
     * @returns The trusted device name.
     */
    getTrustedDeviceName() {
        if (this.configJson.pushData.trustedDeviceName !== undefined) {
            return this.configJson.pushData.trustedDeviceName;
        }
        else {
            return "";
        }
    }
    /**
     * Set the trusted device name for push connection.
     * @param trustedDeviceName The trusted device name
     */
    setTrustedDeviceName(trustedDeviceName) {
        if (this.configJson.pushData.trustedDeviceName !== trustedDeviceName) {
            this.configJson.pushData.trustedDeviceName = trustedDeviceName;
            this.setSerialNumber("");
            this.hasChanged = true;
        }
    }
    /**
     * Get the string of seconds as string how long the event shoud remain in state true.
     * @returns A String value contaiong the seconds
     */
    getEventDurationSeconds() {
        if (this.configJson.pushData.eventDurationSeconds !== undefined) {
            return this.configJson.pushData.eventDurationSeconds;
        }
        else {
            return 10;
        }
    }
    /**
     * Set the number of seconds as string how long the event shoud remain in state true.
     * @param eventDurationSeconds A String value contaiong the seconds
     */
    setEventDurationSeconds(eventDurationSeconds) {
        if (this.configJson.pushData.eventDurationSeconds !== eventDurationSeconds) {
            this.configJson.pushData.eventDurationSeconds = eventDurationSeconds;
            this.hasChanged = true;
        }
    }
    /**
     * Get the boolean value if invitations should be accepted.
     * @returns A boolean value
     */
    getAcceptInvitations() {
        if (this.configJson.pushData.acceptInvitations !== undefined) {
            return this.configJson.pushData.acceptInvitations;
        }
        else {
            return false;
        }
    }
    /**
     * Set the boolean value if invitations should be accepted.
     * @param acceptInvitations A boolean value
     */
    setAcceptInvitations(acceptInvitations) {
        if (this.configJson.pushData.acceptInvitations !== acceptInvitations) {
            this.configJson.pushData.acceptInvitations = acceptInvitations;
            this.hasChanged = true;
        }
    }
    /**
     * Get the openudid for push connections.
     * @returns The openudid
     */
    getOpenudid() {
        if (this.configJson.pushData.openUdid !== undefined) {
            return this.configJson.pushData.openUdid;
        }
        else {
            return "";
        }
    }
    /**
     * Set the openudid for push connections.
     * @param openudid The openudid to set
     */
    setOpenudid(openudid) {
        if (this.configJson.pushData.openUdid !== openudid) {
            this.configJson.pushData.openUdid = openudid;
            this.hasChanged = true;
        }
    }
    /**
     * Get the serial number for push connections.
     * @returns The serial number
     */
    getSerialNumber() {
        if (this.configJson.pushData.serialNumber !== undefined) {
            return this.configJson.pushData.serialNumber;
        }
        else {
            return "";
        }
    }
    /**
     * Set the serial number for push connections.
     * @param serialNumber The serial number to set
     */
    setSerialNumber(serialNumber) {
        if (this.configJson.pushData.serialNumber !== serialNumber) {
            this.configJson.pushData.serialNumber = serialNumber;
            this.hasChanged = true;
        }
    }
    /**
     * Checks if the push credentals are stored in config.
     * @returns true if the credentals are set, otherwise false.
     */
    hasPushCredentials() {
        if (this.getCredentialsCheckinResponse() !== null && this.getCredentialsFidResponse() !== null && this.getCredentialsGcmResponse() !== null) {
            return true;
        }
        else {
            return false;
        }
    }
    /**
     * Get the fid response credentials for push connections.
     * @returns The fid response credentials.
     */
    getCredentialsFidResponse() {
        if (this.configJson.pushData.fidResponse !== undefined) {
            return this.configJson.pushData.fidResponse;
        }
        else {
            return null;
        }
    }
    /**
     * Set the fid response credentials for push connections.
     * @param fidResponse The fid response credentials.
     */
    setCredentialsFidResponse(fidResponse) {
        if (JSON.stringify(this.configJson.pushData.fidResponse) !== JSON.stringify(fidResponse)) {
            this.configJson.pushData.fidResponse = fidResponse;
            this.hasChanged = true;
        }
    }
    /**
     * Get the checkin response credentials for push connections.
     * @returns The checkin response credentials
     */
    getCredentialsCheckinResponse() {
        if (this.configJson.pushData.checkinResponse !== undefined) {
            return this.configJson.pushData.checkinResponse;
        }
        else {
            return null;
        }
    }
    /**
     * Set the checkin response credentials for push connections.
     * @param checkinResponse The checkin response credentials
     */
    setCredentialsCheckinResponse(checkinResponse) {
        if (JSON.stringify(this.configJson.pushData.checkinResponse) !== JSON.stringify(checkinResponse)) {
            this.configJson.pushData.checkinResponse = checkinResponse;
            this.hasChanged = true;
        }
    }
    /**
     * Get the gcm response credentials for push connections.
     * @returns The gcm response credentials
     */
    getCredentialsGcmResponse() {
        try {
            const res = { token: this.configJson.pushData.gcmResponseToken };
            return res;
        }
        catch {
            return null;
        }
    }
    /**
     * Set the gcm response credentials for push connections.
     * @param gcmResponse the gcm response credentials
     */
    setCredentialsGcmResponse(gcmResponse) {
        if (JSON.stringify(this.configJson.pushData.gcmResponseToken) !== JSON.stringify(gcmResponse.token)) {
            this.configJson.pushData.gcmResponseToken = gcmResponse.token;
            this.hasChanged = true;
        }
    }
    /**
     * Get the persistent id credentials for push connections.
     * @returns The persistent id credentials
     */
    getCredentialsPersistentIds() {
        if (this.configJson.pushData.persistentIds !== undefined) {
            return this.configJson.pushData.persistentIds;
        }
        else {
            return [];
        }
    }
    /**
     * Set the persistent id credentials for push connections.
     * @param persistentIds The persistent id credentials
     */
    setCredentialsPersistentIds(persistentIds) {
        if (JSON.stringify(this.configJson.pushData.persistentIds) !== JSON.stringify(persistentIds)) {
            this.configJson.pushData.persistentIds = persistentIds;
            this.hasChanged = true;
        }
    }
    /**
     * Get the country code.
     * @returns The country code
     */
    getCountry() {
        if (this.configJson.accountData.country !== undefined) {
            return this.configJson.accountData.country;
        }
        else {
            return "DE";
        }
    }
    /**
     * Set the country code.
     * @param country The country code.
     */
    setCountry(country) {
        if (this.configJson.accountData.country !== country) {
            this.configJson.accountData.country = country;
            this.hasChanged = true;
        }
    }
    /**
     * Get the language code.
     * @returns The language code
     */
    getLanguage() {
        if (this.configJson.accountData.language !== undefined) {
            return this.configJson.accountData.language;
        }
        else {
            return "de";
        }
    }
    /**
     * Set the language code.
     * @param language The language code
     */
    setLanguage(language) {
        if (this.configJson.accountData.language !== language) {
            this.configJson.accountData.language = language;
            this.hasChanged = true;
        }
    }
    /**
     * Retrieves the interactions from the config.
     * @returns The integrations.
     */
    getInteractions() {
        if (this.configJson.interactions !== undefined) {
            return this.configJson.interactions;
        }
        return null;
    }
    /**
     * Set the integrations.
     * @param interactions The interactions to set.
     */
    setInteractions(interactions) {
        if (JSON.stringify(this.configJson.interactions) !== JSON.stringify(interactions)) {
            this.configJson.interactions = interactions;
            this.hasChanged = true;
        }
    }
    /**
     * Remove all integrations.
     */
    removeInteractions() {
        this.configJson.interactions = null;
    }
    /**
     * Retrieves the device config from the config.
     * @returns The device config.
     */
    getDeviceConfig() {
        if (this.configJson.deviceConfig !== undefined) {
            return this.configJson.deviceConfig;
        }
        return undefined;
    }
    /**
     * Set the device config.
     * @param deviceConfig The device config to set.
     */
    setDeviceConfig(deviceConfig) {
        if (JSON.stringify(this.configJson.deviceConfig) !== JSON.stringify(deviceConfig)) {
            this.configJson.deviceConfig = deviceConfig;
            this.hasChanged = true;
        }
    }
}
exports.Config = Config;
