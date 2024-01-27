import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { CheckinResponse, FidInstallationResponse, GcmRegisterResponse } from './push/models';
import { rootAddonLogger } from './logging';

export class Config
{
    private configJson : any;
    private hasChanged : boolean;
    private taskSaveConfig24h !: NodeJS.Timeout;
    
    /**
     * Constructor, read the config file and provide values to the variables.
     */
    constructor()
    {
        this.hasChanged = false;
        if(this.isConfigFileAvailable() == false)
        {
            this.configJson = this.createEmptyConfigJson();
            this.hasChanged = true;
        }
        if(this.existUploadedConfig() == true)
        {
            try
            {
                this.configJson = this.checkConfigFile(this.loadConfigJson("./config.json.upload"));
                this.hasChanged = true;
                unlinkSync('./config.json.upload');
                rootAddonLogger.info("Loaded config from uploaded file 'config.json.upload'. This file has now been removed.");
            }
            catch
            {
                if(this.existUploadedConfig() == true)
                {
                    unlinkSync('./config.json.upload');
                }
                rootAddonLogger.info("Error while loading config from uploaded file 'config.json.upload'. This file has now been removed. Going now to load old config.json.");
                if(this.isConfigFileAvailable() == false)
                {
                    this.configJson = this.createEmptyConfigJson();
                    this.hasChanged = true;
                }
                else
                {
                    this.configJson = this.loadConfigJson("./config.json");
                }
            }
        }
        else
        {
            if(this.isConfigFileAvailable() == false)
            {
                this.configJson = this.createEmptyConfigJson();
                this.hasChanged = true;
            }
            else
            {
                this.configJson = this.loadConfigJson("./config.json");
            }
        }
        //this.writeConfig(this.configJson);
    }

    /**
     * Remove the scheduling for saveConfig12h
     */
    public close()
    {
        if(this.taskSaveConfig24h)
        {
            rootAddonLogger.info(`Remove scheduling for saveConfig24h.`);
            clearInterval(this.taskSaveConfig24h);
        }
    }

    /**
     * Checks if config.json is available.
     * @returns true if config.json is available, otherwise false.
     */
    private isConfigFileAvailable() : boolean
    {
        if(existsSync('./config.json'))
        {
            return true;
        }
        return false;
    }

    /**
     * Checks if a uploaded config.json.upload is available.
     * @returns true, if there is a uploaded config, otherwise false.
     */
    private existUploadedConfig() : boolean
    {
        if(existsSync('./config.json.upload'))
        {
            return true;
        }
        return false;
    }

    /**
     * Specifies the version for the config file expected by the addon.
     * @returns The expected version of the config file.
     */
    private getConfigFileTemplateVersion() : number
    {
        return 16;
    }

    /**
     * Load the config from the given file and returns the config.
     * @param filePath The parth to the config file.
     * @returns The config.
     */
    private loadConfigJson(filePath : string) : any
    {
        var resConfigJson;
        try
        {
            this.hasChanged = false;
            resConfigJson = JSON.parse(readFileSync(filePath, 'utf-8'));
            this.taskSaveConfig24h = setInterval(async() => { this.writeConfig(this.configJson); }, (24 * 60 * 60 * 1000));
            if(this.updateConfigNeeded(resConfigJson))
            {
                resConfigJson = this.updateConfig(resConfigJson);
            }
        }
        catch (ENOENT)
        {
            rootAddonLogger.error(`No '${filePath}' available.`);
        }
        return resConfigJson;
    }

    /**
     * Check and add config entries to the config string before parsed.
     * @param filecontent The string to check.
     */
    private updateConfigFileTemplateStage1(filecontent : string) : string
    {
        if(filecontent.indexOf("config_file_version") == -1)
        {
            rootAddonLogger.info("Configfile needs Stage1 update. Adding 'config_file_version'.");
            filecontent = "[ConfigFileInfo]\r\nconfig_file_version=0\r\n\r\n" + filecontent;
        }
        return filecontent;
    }

    /**
     * Write given config json to file.
     */
    private writeConfig(configJson : any) : string
    {
        if(this.hasChanged == true)
        {
            try
            {
                writeFileSync('./config.json', JSON.stringify(configJson));
                this.hasChanged = false;
                return "saved";
            }
            catch
            {
                return "failed";
            }
        }
        else
        {
            return "ok";
        }
    }

    /**
     * Write given config json to file.
     * @returns A string indicating the success.
     */
    public writeCurrentConfig() : string
    {
        return this.writeConfig(this.configJson);
    }

    /**
     * Create a empty config object with some default settings.
     * @returns The config object.
     */
    private createEmptyConfigJson() : any
    {
        var config = JSON.parse(`{}`);
        config.configVersion = this.getConfigFileTemplateVersion();

        var accountData = {"eMail": "", "password": "", "encryptedPassword": "", "userId": "", "nickName": "", "clientPrivateKey": "", "serverPublicKey": "", "country": "DE", "language": "de"};
        config.accountData = accountData;

        var tokenData = {"token": "", "tokenExpires": 0};
        config.tokenData = tokenData;

        var pushData = {"trustedDeviceName": "", "serialNumber": "", "eventDurationSeconds": 10, "acceptInvitations": false, "openUdid": "", "fidResponse": "", "checkinResponse": "", "gcmResponseToken": "", "persistentIds": ""};
        config.pushData = pushData;

        var apiConfig = {"httpActive": true, "httpPort": 52789, "httpsActive": true, "httpsPort": 52790, "httpsMethod": "", "httpsPkeyFile": "/usr/local/etc/config/server.pem", "httpsCertFile": "/usr/local/etc/config/server.pem", "httpsPkeyString": "", "houseId": "all", "connectionTypeP2p": 1, "localStaticUdpPortsActive": false, "systemVariableActive": false, "cameraDefaultImage": "", "cameraDefaultVideo": "", "updateCloudInfoIntervall": 10, "updateDeviceDataIntervall": 10, "stateUpdateEventActive": false, "stateUpdateIntervallActive": false, "stateUpdateIntervallTimespan": 15, "updateLinksActive": true, "updateLinksOnlyWhenArmed": false, "updateLinks24hActive": false, "updateLinksTimespan": 15, "pushServiceActive": false};
        config.apiConfig = apiConfig;

        var logConfig = {"logLevelAddon": 2, "logLevelMain": 2, "logLevelHttp": 2, "logLevelP2p": 2, "logLevelPush": 2, "logLevelMqtt": 2};
        config.logConfig = logConfig;

        var stations : [] = [];
        config.stations = stations;

        var devicePublicKeys : [] = [];
        config.devicePublicKeys = devicePublicKeys;

        var interactions = null;
        config.interactions = interactions;

        return config;
    }

    /**
     * Checks if the config file needs to be updated.
     * @param configJson The config as json object.
     * @returns A boolean value, true if the config need to be updated, otherwise false.
     */
    private updateConfigNeeded(configJson : any) : boolean
    {
        if(configJson.configVersion == this.getConfigFileTemplateVersion())
        {
            return false;
        }
        return true;
    }

    /**
     * Update the config.json file to the most recent version.
     * @returns true, if the config was updated, otherwise false.
     */
    private updateConfig(configJson : any) : any
    {
        rootAddonLogger.info(configJson.configVersion);
        rootAddonLogger.info(this.getConfigFileTemplateVersion().toString());
        if(configJson.configVersion < this.getConfigFileTemplateVersion())
        {
            var updated = false;
            if(configJson.configVersion < 12)
            {
                rootAddonLogger.info("Configfile needs Stage2 update to version 12...");
                if(configJson.apiConfig.updateCloudInfoIntervall === undefined)
                {
                    rootAddonLogger.info(" adding 'updateCloudInfoIntervall'.");
                    configJson.apiConfig.updateCloudInfoIntervall = 10;
                }
                if(configJson.apiConfig.updateDeviceDataIntervall === undefined)
                {
                    rootAddonLogger.info(" adding 'updateDeviceDataIntervall'.");
                    configJson.apiConfig.updateDeviceDataIntervall = 10;
                }
                updated = true;
            }
            if(configJson.configVersion < 13)
            {
                rootAddonLogger.info("Configfile needs Stage2 update to version 13...");
                if(configJson.apiConfig.houseId === undefined)
                {
                    rootAddonLogger.info(" adding 'houseId'.");
                    configJson.apiConfig.houseId = "all";
                }
                updated = true;
            }
            if(configJson.configVersion < 14)
            {
                rootAddonLogger.info("Configfile needs Stage2 update to version 14...");
                if(configJson.accountData.userId === undefined)
                {
                    rootAddonLogger.info(" adding 'userId'.");
                    configJson.accountData.userId = "";
                }
                if(configJson.accountData.nickName === undefined)
                {
                    rootAddonLogger.info(" adding 'nickName'.");
                    configJson.accountData.nickName = "";
                }
                if(configJson.accountData.clientPrivateKey === undefined)
                {
                    rootAddonLogger.info(" adding 'clientPrivateKey'.");
                    configJson.accountData.clientPrivateKey = "";
                }
                if(configJson.accountData.serverPublicKey === undefined)
                {
                    rootAddonLogger.info(" adding 'serverPublicKey'.");
                    configJson.accountData.serverPublicKey = "";
                }
                updated = true;
            }
            if(configJson.configVersion < 15)
            {
                rootAddonLogger.info("Configfile needs Stage2 update to version 15...");
                if(configJson.interactions === undefined)
                {
                    rootAddonLogger.info(" adding 'interactions'.");
                    configJson.interactions = null;
                }
                updated = true;
            }
            if(configJson.configVersion < 16)
            {
                rootAddonLogger.info("Configfile needs Stage2 update to version 16...");
                if(configJson.logConfig === undefined)
                {
                    rootAddonLogger.info(" adding 'logConfig'.");
                    configJson.logConfig = null;
                    var logConfig = {"logLevelAddon": 2, "logLevelMain": 2, "logLevelHttp": 2, "logLevelP2p": 2, "logLevelPush": 2, "logLevelMqtt": 2};
                    configJson.logConfig = logConfig;
                }
                updated = true;
            }
            if(updated == true)
            {
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
    private checkConfigFile(configJson : any) : any
    {
        var newConfigJson = this.createEmptyConfigJson()
        if(configJson.configVersion !== undefined)
        {
            newConfigJson.configVersion = configJson.configVersion;
        }

        if(configJson.accountData !== undefined)
        {
            if(configJson.accountData.eMail !== undefined)
            {
                newConfigJson.accountData.eMail = configJson.accountData.eMail;
            }
            if(configJson.accountData.password !== undefined)
            {
                newConfigJson.accountData.password = configJson.accountData.password;
            }
            if(configJson.accountData.encryptedPassword !== undefined)
            {
                newConfigJson.accountData.encryptedPassword = configJson.accountData.encryptedPassword;
            }
            if(configJson.accountData.userId !== undefined)
            {
                newConfigJson.accountData.userId = configJson.accountData.userId;
            }
            if(configJson.accountData.nickName !== undefined)
            {
                newConfigJson.accountData.nickName = configJson.accountData.nickName;
            }
            if(configJson.accountData.clientPrivateKey !== undefined)
            {
                newConfigJson.accountData.clientPrivateKey = configJson.accountData.clientPrivateKey;
            }
            if(configJson.accountData.serverPublicKey !== undefined)
            {
                newConfigJson.accountData.serverPublicKey = configJson.accountData.serverPublicKey;
            }
            if(configJson.accountData.country !== undefined)
            {
                newConfigJson.accountData.country = configJson.accountData.country;
            }
            if(configJson.accountData.language !== undefined)
            {
                newConfigJson.accountData.language = configJson.accountData.language;
            }
        }
        
        if(configJson.tokenData !== undefined)
        {
            if(configJson.tokenData.token !== undefined)
            {
                newConfigJson.tokenData.token = configJson.tokenData.token;
            }
            if(configJson.tokenData.tokenExpires !== undefined)
            {
                newConfigJson.tokenData.tokenExpires = configJson.tokenData.tokenExpires;
            }
        }

        if(configJson.pushData !== undefined)
        {
            if(configJson.pushData.trustedDeviceName !== undefined)
            {
                newConfigJson.pushData.trustedDeviceName = configJson.pushData.trustedDeviceName;
            }
            if(configJson.pushData.serialNumber !== undefined)
            {
                newConfigJson.pushData.serialNumber = configJson.pushData.serialNumber;
            }
            if(configJson.pushData.eventDurationSeconds !== undefined)
            {
                newConfigJson.pushData.eventDurationSeconds = configJson.pushData.eventDurationSeconds;
            }
            if(configJson.pushData.acceptInvitations !== undefined)
            {
                newConfigJson.pushData.acceptInvitations = configJson.pushData.acceptInvitations;
            }
            if(configJson.pushData.openUdid !== undefined)
            {
                newConfigJson.pushData.openUdid = configJson.pushData.openUdid;
            }
            if(configJson.pushData.fidResponse !== undefined)
            {
                newConfigJson.pushData.fidResponse = configJson.pushData.fidResponse;
            }
            if(configJson.pushData.checkinResponse !== undefined)
            {
                newConfigJson.pushData.checkinResponse = configJson.pushData.checkinResponse;
            }
            if(configJson.pushData.gcmResponseToken !== undefined)
            {
                newConfigJson.pushData.gcmResponseToken = configJson.pushData.gcmResponseToken;
            }
            if(configJson.pushData.persistentIds !== undefined)
            {
                newConfigJson.pushData.persistentIds = configJson.pushData.persistentIds;
            }
        }
        
        if(configJson.apiConfig !== undefined)
        {
            if(configJson.apiConfig.httpActive !== undefined)
            {
                newConfigJson.apiConfig.httpActive = configJson.apiConfig.httpActive;
            }
            if(configJson.apiConfig.httpPort !== undefined)
            {
                newConfigJson.apiConfig.httpPort = configJson.apiConfig.httpPort;
            }
            if(configJson.apiConfig.httpsActive !== undefined)
            {
                newConfigJson.apiConfig.httpsActive = configJson.apiConfig.httpsActive;
            }
            if(configJson.apiConfig.httpsPort !== undefined)
            {
                newConfigJson.apiConfig.httpsPort = configJson.apiConfig.httpsPort;
            }
            if(configJson.apiConfig.httpsMethod !== undefined)
            {
                newConfigJson.apiConfig.httpsMethod = configJson.apiConfig.httpsMethod;
            }
            if(configJson.apiConfig.httpsPkeyFile !== undefined)
            {
                newConfigJson.apiConfig.httpsPkeyFile = configJson.apiConfig.httpsPkeyFile;
            }
            if(configJson.apiConfig.httpsCertFile !== undefined)
            {
                newConfigJson.apiConfig.httpsCertFile = configJson.apiConfig.httpsCertFile;
            }
            if(configJson.apiConfig.httpsPkeyString !== undefined)
            {
                newConfigJson.apiConfig.httpsPkeyString = configJson.apiConfig.httpsPkeyString;
            }
            if(configJson.apiConfig.houseId !== undefined)
            {
                newConfigJson.apiConfig.houseId = configJson.apiConfig.houseId;
            }
            if(configJson.apiConfig.connectionTypeP2p !== undefined)
            {
                newConfigJson.apiConfig.connectionTypeP2p = configJson.apiConfig.connectionTypeP2p;
            }
            if(configJson.apiConfig.localStaticUdpPortsActive !== undefined)
            {
                newConfigJson.apiConfig.localStaticUdpPortsActive = configJson.apiConfig.localStaticUdpPortsActive;
            }
            if(configJson.apiConfig.systemVariableActive !== undefined)
            {
                newConfigJson.apiConfig.systemVariableActive = configJson.apiConfig.systemVariableActive;
            }
            if(configJson.apiConfig.cameraDefaultImage !== undefined)
            {
                newConfigJson.apiConfig.cameraDefaultImage = configJson.apiConfig.cameraDefaultImage;
            }
            if(configJson.apiConfig.cameraDefaultVideo !== undefined)
            {
                newConfigJson.apiConfig.cameraDefaultVideo = configJson.apiConfig.cameraDefaultVideo;
            }
            if(configJson.apiConfig.updateCloudInfoIntervall !== undefined)
            {
                newConfigJson.apiConfig.updateCloudInfoIntervall = configJson.apiConfig.updateCloudInfoIntervall;
            }
            if(configJson.apiConfig.updateDeviceDataIntervall !== undefined)
            {
                newConfigJson.apiConfig.updateDeviceDataIntervall = configJson.apiConfig.updateDeviceDataIntervall;
            }
            if(configJson.apiConfig.stateUpdateEventActive !== undefined)
            {
                newConfigJson.apiConfig.stateUpdateEventActive = configJson.apiConfig.stateUpdateEventActive;
            }
            if(configJson.apiConfig.stateUpdateIntervallActive !== undefined)
            {
                newConfigJson.apiConfig.stateUpdateIntervallActive = configJson.apiConfig.stateUpdateIntervallActive;
            }
            if(configJson.apiConfig.stateUpdateIntervallTimespan !== undefined)
            {
                newConfigJson.apiConfig.stateUpdateIntervallTimespan = configJson.apiConfig.stateUpdateIntervallTimespan;
            }
            if(configJson.apiConfig.updateLinksActive !== undefined)
            {
                newConfigJson.apiConfig.updateLinksActive = configJson.apiConfig.updateLinksActive;
            }
            if(configJson.apiConfig.updateLinksOnlyWhenArmed !== undefined)
            {
                newConfigJson.apiConfig.updateLinksOnlyWhenArmed = configJson.apiConfig.updateLinksOnlyWhenArmed;
            }
            if(configJson.apiConfig.updateLinks24hActive !== undefined)
            {
                newConfigJson.apiConfig.updateLinks24hActive = configJson.apiConfig.updateLinks24hActive;
            }
            if(configJson.apiConfig.updateLinksTimespan !== undefined)
            {
                newConfigJson.apiConfig.updateLinksTimespan = configJson.apiConfig.updateLinksTimespan;
            }
            if(configJson.apiConfig.pushServiceActive !== undefined)
            {
                newConfigJson.apiConfig.pushServiceActive = configJson.apiConfig.pushServiceActive;
            }
        }

        if(configJson.logConfig !== undefined)
        {
            if(configJson.logConfig.logLevelAddon !== undefined)
            {
                newConfigJson.logConfig.logLevelAddon = configJson.logConfig.logLevelAddon;
            }
            if(configJson.logConfig.logLevelMain !== undefined)
            {
                newConfigJson.logConfig.logLevelMain = configJson.logConfig.logLevelMain;
            }
            if(configJson.logConfig.logLevelHttp !== undefined)
            {
                newConfigJson.logConfig.logLevelHttp = configJson.logConfig.logLevelHttp;
            }
            if(configJson.logConfig.logLevelP2p !== undefined)
            {
                newConfigJson.logConfig.logLevelP2p = configJson.logConfig.logLevelP2p;
            }
            if(configJson.logConfig.logLevelPush !== undefined)
            {
                newConfigJson.logConfig.logLevelPush = configJson.logConfig.logLevelPush;
            }
            if(configJson.logConfig.logLevelMqtt !== undefined)
            {
                newConfigJson.logConfig.logLevelMqtt = configJson.logConfig.logLevelMqtt;
            }
        }

        if(configJson.stations !== undefined)
        {
            newConfigJson.stations = configJson.stations;
        }

        return newConfigJson;
    }

    private checkConfigValues() : boolean
    {
        var updated = false;
        if(this.configJson.httpActive == true && (this.configJson.httpPort < 1 || this.configJson.httpPort > 65535))
        {
            rootAddonLogger.info(`Set httpPort to default value "52789"`);
            this.configJson.httpPort = 52789;
            updated = true;
        }
        if(this.configJson.httpsActive == true && (this.configJson.httpsPort < 1 || this.configJson.httpsPort > 65535))
        {
            rootAddonLogger.info(`Set httpsPort to default value "52790"`);
            this.configJson.httpsPort = 52790;
            updated = true;
        }
        if(this.configJson.httpActive == true && this.configJson.httpsActive == true && this.configJson.httpPort == this.configJson.httpsPort)
        {
            rootAddonLogger.info(`Set httpPort to default value "52789" and httpsPort to default value "52790"`);
            this.configJson.httpPort = 52789;
            this.configJson.httpsPort = 52790;
            updated = true;
        }
        if(this.configJson.localStaticUdpPortsActive == true)
        {
            var udpPorts = [];
            var stations = this.configJson.stations;
            if(stations.length > 2)
            {
                for(var station in stations)
                {
                    if(udpPorts[this.configJson.stations[station].udpPort] === undefined)
                    {
                        udpPorts[this.configJson.stations[station].udpPort] = this.configJson.stations[station].udpPort;
                    }
                    else
                    {
                        rootAddonLogger.info(`Set localStaticUdpPortsActive to default value "false". Please check updPorts for stations, they must be unique.`);
                        this.configJson.localStaticUdpPortsActive = false;
                        updated = true;
                    }
                }
            }
        }
        
        if(this.configJson.stateUpdateIntervallActive && (this.configJson.stateUpdateIntervallTimespan < 15 || this.configJson.stateUpdateIntervallTimespan > 240))
        {
            rootAddonLogger.info(`Set stateUpdateIntervallTimespan to default value "10"`);
            this.configJson.stateUpdateIntervallTimespan = 10;
            updated = true;
        }
        if(this.configJson.updateLinksOnlyWhenArmed && (this.configJson.updateLinksTimespan < 15 || this.configJson.updateLinksTimespan > 240))
        {
            rootAddonLogger.info(`Set updateLinksTimespan to default value "10"`);
            this.configJson.updateLinksTimespan = 10;
            updated = true;
        }
        if(this.configJson.logLevel < 0 || this.configJson.logLevel > 6)
        {
            rootAddonLogger.info(`Set logLevel to default value "0"`);
            this.configJson.logLevel = 0;
            updated = true;
        }
        return updated;
    }

    /**
     * Add section for a new station.
     * @param stationSerial Serialnumber of the new station.
     */
    private updateWithNewStation(stationSerial : string) : boolean
    {
        rootAddonLogger.info(`Adding station ${stationSerial} to settings.`);
        var station = {"stationSerial": stationSerial, "p2pDid": null, "stationIpAddress": null, "udpPort": null};

        if(Array.isArray(this.configJson.stations))
        {
            this.configJson.stations.push(station);
        }
        else
        {
            var stations = [];
            stations.push(station);
            this.configJson.stations = stations
        }

        this.hasChanged = true;
        return true;
    }

    /**
     * Checks if the station given by serialnumber is in the config.
     * @param stationSerial The serial of the station to check.
     */
    private isStationInConfig(stationSerial : string) : boolean
    {
        if(Array.isArray(this.configJson.stations))
        {
            var station;
            for (station in this.configJson.stations)
            {
                if(this.configJson.stations[station] !== undefined && this.configJson.stations[station].stationSerial ==  stationSerial)
                {
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
    private getStationIterator(stationSerial : string) : string | undefined
    {
        if(Array.isArray(this.configJson.stations))
        {
            var station;
            for (station in this.configJson.stations)
            {
                if(this.configJson.stations[station] !== undefined && this.configJson.stations[station].stationSerial == stationSerial)
                {
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
    public getConfigFileVersion() : string
    {
        if(this.configJson.configVersion !== undefined)
        {
            return this.configJson.configVersion;
        }
        else
        {
            return "";
        }
    }

    /**
     * Get the eMail address of the eufy security account.
     */
    public getEmailAddress() : string
    {
        if(this.configJson.accountData.eMail !== undefined)
        {
            return this.configJson.accountData.eMail;
        }
        else
        {
            return "";
        }
    }

    /**
     * Set the eMail address for the eufy security account.
     * @param email The eMail address to set.
     */
    public setEmailAddress(eMail : string) : void
    {
        if(this.configJson.accountData.eMail != eMail)
        {
            this.configJson.accountData.eMail = eMail;
            this.setToken("");
            this.hasChanged = true;
        }
    }

    /**
     * Get the user id of the eufy security account.
     */
    public getUserId() : string
    {
        if(this.configJson.accountData.userId !== undefined)
        {
            return this.configJson.accountData.userId;
        }
        else
        {
            return "";
        }
    }

    /**
     * Set the user id for the eufy security account.
     * @param userId The user id to set.
     */
    public setUserId(userId : string) : void
    {
        if(this.configJson.accountData.userId != userId)
        {
            this.configJson.accountData.userId = userId;
            this.hasChanged = true;
        }
    }

    /**
     * Get the password for the eufy security account.
     */
    public getPassword() : string
    {
        if(this.configJson.accountData.password !== undefined)
        {
            return this.configJson.accountData.password;
        }
        else
        {
            return "";
        }
    }

    /**
     * Set the passwort for the eufy security account.
     * @param password The password to set.
     */
    public setPassword(password : string) : void
    {
        if(this.configJson.accountData.password != password)
        {
            this.configJson.accountData.password = password;
            this.hasChanged = true;
        }
    }

    /**
     * Get the nickname of the eufy security account.
     */
    public getNickName() : string
    {
        if(this.configJson.accountData.nickName !== undefined)
        {
            return this.configJson.accountData.nickName;
        }
        else
        {
            return "";
        }
    }

    /**
     * Set the nickname for the eufy security account.
     * @param nickName The nickname to set.
     */
    public setNickName(nickName : string) : void
    {
        if(this.configJson.accountData.nickName != nickName)
        {
            this.configJson.accountData.nickName = nickName;
            this.hasChanged = true;
        }
    }

    /**
     * Get the client private key of the eufy security account.
     */
    public getClientPrivateKey() : string
    {
        if(this.configJson.accountData.clientPrivateKey !== undefined)
        {
            return this.configJson.accountData.clientPrivateKey;
        }
        else
        {
            return "";
        }
    }

    /**
     * Set the client private key for the eufy security account.
     * @param clientPrivateKey The client private key to set.
     */
    public setClientPrivateKey(clientPrivateKey : string) : void
    {
        if(this.configJson.accountData.clientPrivateKey != clientPrivateKey)
        {
            this.configJson.accountData.clientPrivateKey = clientPrivateKey;
            this.hasChanged = true;
        }
    }

    /**
     * Get the server public key of the eufy security account.
     */
    public getServerPublicKey() : string
    {
        if(this.configJson.accountData.serverPublicKey !== undefined)
        {
            return this.configJson.accountData.serverPublicKey;
        }
        else
        {
            return "";
        }
    }

    /**
     * Set the server public key for the eufy security account.
     * @param serverPublicKey The server public key to set.
     */
    public setServerPublicKey(serverPublicKey : string) : void
    {
        if(this.configJson.accountData.serverPublicKey != serverPublicKey)
        {
            this.configJson.accountData.serverPublicKey = serverPublicKey;
            this.hasChanged = true;
        }
    }

    /**
     * Get the devices public keys of the eufy security account.
     */
    public getDevicePublicKeys() : any
    {
        if(this.configJson.devicePublicKeys !== undefined)
        {
            return this.configJson.devicePublicKeys;
        }
        else
        {
            return "";
        }
    }

    /**
     * Set the device public keys for the eufy security account.
     * @param devicePublicKeys The device public keys to set.
     */
    public setDevicePublicKeys(devicePublicKeys : any) : void
    {
        if(this.configJson.devicePublicKeys != devicePublicKeys)
        {
            this.configJson.devicePublicKeys = devicePublicKeys;
            this.hasChanged = true;
        }
    }

    /**
     * Returns true if the connection type for connecting with station.
     */
    public getConnectionType() : number
    {
        if(this.configJson.apiConfig.connectionTypeP2p !== undefined)
        {
            return this.configJson.apiConfig.connectionTypeP2p;
        }
        else
        {
            return -1;
        }
    }
 
    /**
     * Sets true, if static udp ports should be used otherwise false.
     * @param connectionTypeP2p Boolean value.
     */
    public setConnectionType(connectionTypeP2p : number) : void
    {
        if(this.configJson.apiConfig.connectionTypeP2p != connectionTypeP2p)
        {
            this.configJson.apiConfig.connectionTypeP2p = connectionTypeP2p;
            this.hasChanged = true;
        }
    }

    /**
     * Returns true if the static udp ports should be used otherwise false.
     */
    public getLocalStaticUdpPortsActive() : boolean
    {
        if(this.configJson.apiConfig.localStaticUdpPortsActive !== undefined)
        {
            return this.configJson.apiConfig.localStaticUdpPortsActive;
        }
        else
        {
            return false;
        }
    }

    /**
     * Sets true, if static udp ports should be used otherwise false.
     * @param localStaticUdpPortsActive Boolean value.
     */
    public setLocalStaticUdpPortsActive(localStaticUdpPortsActive : boolean) : void
    {
        if(this.configJson.apiConfig.localStaticUdpPortsActive != localStaticUdpPortsActive)
        {
            this.configJson.apiConfig.localStaticUdpPortsActive = localStaticUdpPortsActive;
            this.hasChanged = true;
        }
    }

    /**
     * Set the udp static ports for local communication.
     * @param ports A string with the ports splitted by a comma.
     */
    public setLocalStaticUdpPorts(ports : string[]) : boolean
    {
        var done = false;
        if(ports)
        {
            for (var array of ports)
            {
                var portNumber;
                if(array[1] == null)
                {
                    portNumber = null;
                }
                else
                {
                    portNumber = Number.parseInt(array[1]);
                }
                if(this.setLocalStaticUdpPortPerStation(array[0], portNumber) == true)
                {
                    done = true;
                }
            }
        }
        return done;
    }

    /**
     * Get a boolean value if the api shoud set system variables on the CCU.
     */
    public getSystemVariableActive() : boolean
    {
        if(this.configJson.apiConfig.systemVariableActive !== undefined)
        {
            return this.configJson.apiConfig.systemVariableActive;
        }
        else
        {
            return false;
        }
    }

    /**
     * Set a boolean value if the api shoud set system variables on the CCU.
     * @param systemVariableActive Set system variables on the CCU.
     */
    public setSystemVariableActive(systemVariableActive : boolean) : void
    {
        if(this.configJson.apiConfig.systemVariableActive != systemVariableActive)
        {
            this.configJson.apiConfig.systemVariableActive = systemVariableActive;
            this.hasChanged = true;
        }
    }

    /**
     * Get weather http should be used for api.
     */
    public getHttpActive() : boolean
    {
        if(this.configJson.apiConfig.httpActive !== undefined)
        {
            return this.configJson.apiConfig.httpActive;
        }
        else
        {
            return false;
        }
    }

    /**
     * Set weather http sould be used for api.
     * @param httpActive Use http for the api.
     */
    public setHttpActive(httpActive : boolean) : void
    {
        if(this.configJson.apiConfig.httpActive != httpActive)
        {
            this.configJson.apiConfig.httpActive = httpActive;
            this.hasChanged = true;
        }
    }

    /**
     * Get the port for the webserver (HTTP) for the api.
     */
    public getHttpPort() : number
    {
        if(this.configJson.apiConfig.httpPort !== undefined)
        {
            return this.configJson.apiConfig.httpPort;
        }
        else
        {
            return 0;
        }
    }

    /**
     * Set the port for the webserver (HTTP) for the api.
     * @param httpPort The port the api should be accessable.
     */
    public setHttpPort(httpPort : number) : void
    {
        if(this.configJson.apiConfig.httpPort != httpPort)
        {
            this.configJson.apiConfig.httpPort = httpPort;
            this.hasChanged = true;
        }
    }

    /**
     * Get weather https should be used for api.
     */
    public getHttpsActive() : boolean
    {
        if(this.configJson.apiConfig.httpsActive !== undefined)
        {
            return this.configJson.apiConfig.httpsActive;
        }
        else
        {
            return false;
        }
    }

    /**
     * Set weather https sould be used for api.
     * @param httpsActive Use https for the api.
     */
    public setHttpsActive(httpsActive : boolean) : void
    {
        if(this.configJson.apiConfig.httpsActive != httpsActive)
        {
            this.configJson.apiConfig.httpsActive = httpsActive;
            this.hasChanged = true;
        }
    }

    /**
     * Get the port for the webserver (HTTPS) for the api.
     */
    public getHttpsPort() : number
    {
        if(this.configJson.apiConfig.httpsPort !== undefined)
        {
            return this.configJson.apiConfig.httpsPort;
        }
        else
        {
            return 0;
        }
    }

    /**
     * Set the port for the webserver (HTTPS) for the api.
     * @param httpsPort The port the api should be accessable.
     */
    public setHttpsPort(httpsPort : number) : void
    {
        if(this.configJson.apiConfig.httpsPort != httpsPort)
        {
            this.configJson.apiConfig.httpsPort = httpsPort;
            this.hasChanged = true;
        }
    }

    /**
     * Returns the method used for https.
     */
    public getHttpsMethod() : string
    {
        if(this.configJson.apiConfig.httpsMethod !== undefined)
        {
            return this.configJson.apiConfig.httpsMethod;
        }
        else
        {
            return "";
        }
    }

    /**
     * Set the method used for https.
     * @param httpsMethod The method for https.
     */
    public setHttpsMethod(httpsMethod : string) : void
    {
        if(this.configJson.apiConfig.httpsMethod != httpsMethod)
        {
            this.configJson.apiConfig.httpsMethod = httpsMethod;
            this.hasChanged = true;
        }
    }

    /**
     * Get the key for https.
     */
    public getHttpsPKeyFile() : string
    {
        if(this.configJson.apiConfig.httpsPkeyFile !== undefined)
        {
            return this.configJson.apiConfig.httpsPkeyFile;
        }
        else
        {
            return "";
        }
    }

    /**
     * Set the key for https.
     * @param httpsPkeyFile The path to the key file for https.
     */
    public setHttpsPKeyFile(httpsPkeyFile : string) : void
    {
        if(this.configJson.apiConfig.httpsPKeyFile != httpsPkeyFile)
        {
            this.configJson.apiConfig.httpsPKeyFile = httpsPkeyFile;
            this.hasChanged = true;
        }
    }

    /**
     * Returns the cert file for https.
     */
    public getHttpsCertFile() : string
    {
        if(this.configJson.apiConfig.httpsCertFile !== undefined)
        {
            return this.configJson.apiConfig.httpsCertFile;
        }
        else
        {
            return "";
        }
    }

    /**
     * Set the cert for https.
     * @param httpsCertFile The cert file for https.
     */
    public setHttpsCertFile(httpsCertFile : string) : void
    {
        if(this.configJson.apiConfig.httpsCertFile != httpsCertFile)
        {
            this.configJson.apiConfig.httpsCertFile = httpsCertFile;
            this.hasChanged = true;
        }
    }

    /**
     * Get the key as string for https.
     */
    public getHttpsPkeyString() : string
    {
        if(this.configJson.apiConfig.httpsPkeyString !== undefined)
        {
            return this.configJson.apiConfig.httpsPkeyString;
        }
        else
        {
            return "";
        }
    }

    /**
     * Set the houseId for filtering station and devices.
     * @param houseId The id for the house as string.
     */
    public setHouseId(houseId : string) : void
    {
        if(this.configJson.apiConfig.houseId != houseId)
        {
            this.configJson.apiConfig.houseId = houseId;
            this.hasChanged = true;
        }
    }

    /**
     * Get the houseId as string for filtering stations and devices.
     */
    public getHouseId() : string
    {
        if(this.configJson.apiConfig.houseId !== undefined)
        {
            return this.configJson.apiConfig.houseId;
        }
        else
        {
            return "all";
        }
    }

    /**
     * Set the key as string for https.
     * @param httpsPkeyString The key for https as string.
     */
    public setHttpsPkeyString(httpsPkeyString : string) : void
    {
        if(this.configJson.apiConfig.httpsPkeyString != httpsPkeyString)
        {
            this.configJson.apiConfig.httpsPkeyString = httpsPkeyString;
            this.hasChanged = true;
        }
    }

    /**
     * Get the default image for cameras.
     */
    public getCameraDefaultImage() : string
    {
        if(this.configJson.apiConfig.cameraDefaultImage !== undefined)
        {
            return this.configJson.apiConfig.cameraDefaultImage;
        }
        else
        {
            return "";
        }
    }

    /**
     * Set the default image for cameras.
     * @param cameraDefaultImage The path to the default camera image.
     */
    public setCameraDefaultImage(cameraDefaultImage : string) : void
    {
        if(this.configJson.apiConfig.cameraDefaultImage != cameraDefaultImage)
        {
            this.configJson.apiConfig.cameraDefaultImage = cameraDefaultImage;
            this.hasChanged = true;
        }
    }

    /**
     * Get the default video for cameras.
     */
    public getCameraDefaultVideo() : string
    {
        if(this.configJson.apiConfig.cameraDefaultVideo !== undefined)
        {
            return this.configJson.apiConfig.cameraDefaultVideo;
        }
        else
        {
            return "";
        }
    }

    /**
     * Set the default video for cameras.
     * @param cameraDefaultVideo The path to the default camera video.
     */
    public setCameraDefaultVideo(cameraDefaultVideo : string) : void
    {
        if(this.configJson.apiConfig.cameraDefaultVideo != cameraDefaultVideo)
        {
            this.configJson.apiConfig.cameraDefaultVideo = cameraDefaultVideo;
            this.hasChanged = true;
        }
    }

    /**
     * Get the timespan intervall for retrieving data from the cloud.
     * @returns The timespan duration as number.
     */
    public getUpdateCloudInfoIntervall() : number
    {
        if(this.configJson.apiConfig.updateCloudInfoIntervall !== undefined)
        {
            return this.configJson.apiConfig.updateCloudInfoIntervall;
        }
        else
        {
            return 10;
        }
    }

    /**
     * Set the timespan intervall for retrieving data from the cloud.
     * @param updateCloudInfoIntervall The timespan duration as number.
     */
    public setUpdateCloudInfoIntervall(updateCloudInfoIntervall : number) : void
    {
        if(this.configJson.apiConfig.updateCloudInfoIntervall != updateCloudInfoIntervall)
        {
            this.configJson.apiConfig.updateCloudInfoIntervall = updateCloudInfoIntervall;
            this.hasChanged = true;
        }
    }

    /**
     * Get the timespan intervall for retrieving device data.
     * @returns The timespan duration as number.
     */
    public getUpdateDeviceDataIntervall() : number
    {
        if(this.configJson.apiConfig.updateDeviceDataIntervall !== undefined)
        {
            return this.configJson.apiConfig.updateDeviceDataIntervall;
        }
        else
        {
            return 10;
        }
    }

    /**
     * Set the timespan intervall for retrieving device data.
     * @param updateDeviceDataIntervall The timespan duration as number.
     */
    public setUpdateDeviceDataIntervall(updateDeviceDataIntervall : number) : void
    {
        if(this.configJson.apiConfig.updateDeviceDataIntervall != updateDeviceDataIntervall)
        {
            this.configJson.apiConfig.updateDeviceDataIntervall = updateDeviceDataIntervall;
            this.hasChanged = true;
        }
    }

    /**
     * Determines if the updated state runs by event.
     */
    public getStateUpdateEventActive() : boolean
    {
        if(this.configJson.apiConfig.stateUpdateEventActive !== undefined)
        {
            return this.configJson.apiConfig.stateUpdateEventActive;
        }
        else
        {
            return false;
        }
    }

    /**
     * Set the value for update state eventbased.
     * @param stateUpdateEventActive The value if the state should updated eventbased.
     */
    public setStateUpdateEventActive(stateUpdateEventActive : boolean) : void
    {
        if(this.configJson.apiConfig.stateUpdateEventActive != stateUpdateEventActive)
        {
            this.configJson.apiConfig.stateUpdateEventActive = stateUpdateEventActive;
            this.hasChanged = true;
        }
    }

    /**
     * Determines if the updated state runs scheduled.
     */
    public getStateUpdateIntervallActive() : boolean
    {
        if(this.configJson.apiConfig.stateUpdateIntervallActive !== undefined)
        {
            return this.configJson.apiConfig.stateUpdateIntervallActive;
        }
        else
        {
            return false;
        }
    }

    /**
     * Set the value for update state scheduled.
     * @param stateUpdateIntervallActive The value if the state should updated scheduled.
     */
    public setStateUpdateIntervallActive(stateUpdateIntervallActive : boolean) : void
    {
        if(this.configJson.apiConfig.stateUpdateIntervallActive != stateUpdateIntervallActive)
        {
            this.configJson.apiConfig.stateUpdateIntervallActive = stateUpdateIntervallActive;
            this.hasChanged = true;
        }
    }

    /**
     * Returns the time between runs of two scheduled tasks for update state.
     */
    public getStateUpdateIntervallTimespan() : number
    {
        if(this.configJson.apiConfig.stateUpdateIntervallTimespan !== undefined)
        {
            return this.configJson.apiConfig.stateUpdateIntervallTimespan;
        }
        else
        {
            return 15;
        }
    }

    /**
     * Set the value for the time between runs of two scheduled tasks for update state. 
     * @param stateUpdateIntervallTimespan The time in minutes.
     */
    public setStateUpdateIntervallTimespan(stateUpdateIntervallTimespan : number) : void
    {
        if(this.configJson.apiConfig.stateUpdateIntervallTimespan != stateUpdateIntervallTimespan)
        {
            this.configJson.apiConfig.stateUpdateIntervallTimespan = stateUpdateIntervallTimespan;
            this.hasChanged = true;
        }
    }

    /**
     * Determines if the updated links runs scheduled.
     */
    public getUpdateLinksActive() : boolean
    {
        if(this.configJson.apiConfig.updateLinksActive !== undefined)
        {
            return this.configJson.apiConfig.updateLinksActive;
        }
        else
        {
            return false;
        }
    }

    /**
     * Set the value for update links scheduled.
     * @param updateLinksActive The value if the links should updated scheduled.
     */
    public setUpdateLinksActive(updateLinksActive : boolean) : void
    {
        if(this.configJson.apiConfig.updateLinksActive != updateLinksActive)
        {
            this.configJson.apiConfig.updateLinksActive = updateLinksActive;
            this.hasChanged = true;
        }
    }

    /**
     * Returns the time between runs of two scheduled tasks for update state.
     */
    public getUpdateLinksTimespan() : number
    {
        if(this.configJson.apiConfig.updateLinksTimespan !== undefined)
        {
            return this.configJson.apiConfig.updateLinksTimespan;
        }
        else
        {
            return 15;
        }
    }

    /**
     * Set the value for the time between runs of two scheduled tasks for update links.
     * @param updateLinksTimespan The time in minutes.
     */
    public setUpdateLinksTimespan(updateLinksTimespan : number) : void
    {
        if(this.configJson.apiConfig.updateLinksTimespan != updateLinksTimespan)
        {
            this.configJson.apiConfig.updateLinksTimespan = updateLinksTimespan;
            this.hasChanged = true;
        }
    }

    /**
     * Return weather the api should only refresh links when eufy state is other than off or deactivated.
     */
    public getUpdateLinksOnlyWhenArmed() : boolean
    {
        if(this.configJson.apiConfig.updateLinksOnlyWhenArmed !== undefined)
        {
            return this.configJson.apiConfig.updateLinksOnlyWhenArmed;
        }
        else
        {
            return false;
        }
    }

    /**
     * Set the value the api should only refresh links when eufy state is other than off or deactivated
     * @param updateLinksOnlyWhenArmed true for not refreshing links during off or deactivated, otherwise false.
     */
    public setUpdateLinksOnlyWhenArmed(updateLinksOnlyWhenArmed : boolean)
    {
        if(this.configJson.apiConfig.updateLinksOnlyWhenArmed != updateLinksOnlyWhenArmed)
        {
            this.configJson.apiConfig.updateLinksOnlyWhenArmed = updateLinksOnlyWhenArmed;
            this.hasChanged = true;
        }
    }

    /**
     * Returns the log level for addon.
     */
    public getLogLevelAddon() : number
    {
        if(this.configJson.logConfig.logLevelAddon !== undefined)
        {
            return this.configJson.logConfig.logLevelAddon;
        }
        else
        {
            return 0;
        }
    }

    /**
     * Set the log level for addon.
     * @param logLevel The log level as number to set
     */
    public setLogLevelAddon(logLevel : number) : void
    {
        if(this.configJson.logConfig.logLevelAddon != logLevel)
        {
            this.configJson.logConfig.logLevelAddon = logLevel;
            this.hasChanged = true;
        }
    }

    /**
     * Returns the log level for main.
     */
    public getLogLevelMain() : number
    {
        if(this.configJson.logConfig.logLevelMain !== undefined)
        {
            return this.configJson.logConfig.logLevelMain;
        }
        else
        {
            return 0;
        }
    }

    /**
     * Set the log level for main.
     * @param logLevel The log level as number to set
     */
    public setLogLevelMain(logLevel : number) : void
    {
        if(this.configJson.logConfig.logLevelMain != logLevel)
        {
            this.configJson.logConfig.logLevelmain = logLevel;
            this.hasChanged = true;
        }
    }

    /**
     * Returns the log level for http.
     */
    public getLogLevelHttp() : number
    {
        if(this.configJson.logConfig.logLevelHttp !== undefined)
        {
            return this.configJson.logConfig.logLevelHttp;
        }
        else
        {
            return 0;
        }
    }

    /**
     * Set the log level for http.
     * @param logLevel The log level as number to set
     */
    public setLogLevelHttp(logLevel : number) : void
    {
        if(this.configJson.logConfig.logLevelHttp != logLevel)
        {
            this.configJson.logConfig.logLevelHttp = logLevel;
            this.hasChanged = true;
        }
    }

    /**
     * Returns the log level for p2p.
     */
    public getLogLevelP2p() : number
    {
        if(this.configJson.logConfig.logLevelP2p !== undefined)
        {
            return this.configJson.logConfig.logLevelP2p;
        }
        else
        {
            return 0;
        }
    }

    /**
     * Set the log level for p2p.
     * @param logLevel The log level as number to set
     */
    public setLogLevelP2p(logLevel : number) : void
    {
        if(this.configJson.logConfig.logLevelP2p != logLevel)
        {
            this.configJson.logConfig.logLevelP2p = logLevel;
            this.hasChanged = true;
        }
    }

    /**
     * Returns the log level for push.
     */
    public getLogLevelPush() : number
    {
        if(this.configJson.logConfig.logLevelPush !== undefined)
        {
            return this.configJson.logConfig.logLevelPush;
        }
        else
        {
            return 0;
        }
    }

    /**
     * Set the log level for push.
     * @param logLevel The log level as number to set
     */
    public setLogLevelPush(logLevel : number) : void
    {
        if(this.configJson.logConfig.logLevelPush != logLevel)
        {
            this.configJson.logConfig.logLevelPush = logLevel;
            this.hasChanged = true;
        }
    }

    /**
     * Returns the log level for mqtt.
     */
    public getLogLevelMqtt() : number
    {
        if(this.configJson.logConfig.logLevelMqtt !== undefined)
        {
            return this.configJson.logConfig.logLevelMqtt;
        }
        else
        {
            return 0;
        }
    }

    /**
     * Set the log level for mqtt.
     * @param logLevel The log level as number to set
     */
    public setLogLevelMqtt(logLevel : number) : void
    {
        if(this.configJson.logConfig.logLevelMqtt != logLevel)
        {
            this.configJson.logConfig.logLevelMqtt = logLevel;
            this.hasChanged = true;
        }
    }

    /**
     * Get the token for login to the eufy security account.
     */
    public getToken() : string
    {
        if(this.configJson.tokenData.token !== undefined)
        {
            return this.configJson.tokenData.token;
        }
        else
        {
            return "";
        }
    }

    /**
     * Set the token for login to the eufy security account.
     * @param token The token for login.
     */
    public setToken(token : string | undefined) : void
    {
        if(this.configJson.tokenData.token != token)
        {
            if(token === undefined)
            {
                token = "";
            }
            this.configJson.tokenData.token = token;
            this.hasChanged = true;
        }
    }

    /**
     * Get the timestamp the token expires.
     */
    public getTokenExpire() : number
    {
        if(this.configJson.tokenData.tokenExpires !== undefined)
        {
            return this.configJson.tokenData.tokenExpires;
        }
        else
        {
            return 0;
        }
    }

    /**
     * Set the timestamp the token expires.
     * @param tokenexpire The time the token expires.
     */
    public setTokenExpire(tokenexpire : number | undefined) : void
    {
        if(this.configJson.tokenData.tokenExpires != tokenexpire)
        {
            if(tokenexpire === undefined)
            {
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
    public getP2PDataP2pDid(stationSerial : string) : string
    {
        var station = this.getStationIterator(stationSerial);
        if(station !== undefined && this.configJson.stations !== undefined && this.configJson.stations[station] !== undefined && this.configJson.stations[station].p2pDid !== undefined)
        {
            return this.configJson.stations[station].p2pDid;
        }
        else
        {
            return "";
        }
    }

    /**
     * Set the P2P_DID for the given station.
     * @param stationSerial The serialnumber of the station.
     * @param p2p_did The P2P_DID to set.
     */
    private setP2PDataP2pDid(stationSerial : string, p2pDid : string) : void
    {
        var station = this.getStationIterator(stationSerial);
        if(station !== undefined)
        {
            if(this.configJson.stations[station].p2pDid != p2pDid)
            {
                this.configJson.stations[station].p2pDid = p2pDid;
                this.hasChanged = true;
            }
        }
    }

    /**
     * Get the local ip address of the station.
     * @param stationSerial The serialnumber of the station.
     */
    public getP2PDataStationIpAddress(stationSerial: string) : string
    {
        var station = this.getStationIterator(stationSerial);
        if(station !== undefined && this.configJson.stations !== undefined && this.configJson.stations[station] !== undefined && this.configJson.stations[station].stationIpAddress !== undefined)
        {
            return this.configJson.stations[station].stationIpAddress;
        }
        else
        {
            return "";
        }
    }

    /**
     * Set the local ip address of the given station.
     * @param stationSerial The serialnumber of the station.
     * @param stationIpAddress The local ip address.
     */
    private setP2PDataStationIpAddress(stationSerial: string, stationIpAddress : string) : void
    {
        var station = this.getStationIterator(stationSerial);
        if(station !== undefined)
        {
            if(this.configJson.stations[station].stationIpAddress != stationIpAddress)
            {
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
    public getLocalStaticUdpPortPerStation(stationSerial : string) : number | null
    {
        var station = this.getStationIterator(stationSerial);
        if(station !== undefined && this.configJson.stations !== undefined && this.configJson.stations[station] !== undefined && this.configJson.stations[station].udpPort !== undefined && this.configJson.stations[station].udpPort !== null)
        {
            return this.configJson.stations[station].udpPort;
        }
        else
        {
            return null;
        }
    }

    /**
     * Set the UDP port for a station.
     * @param stationSerial The serial for the station.
     * @param udpPort The UDP port.
     * @returns True on success otherwise false.
     */
    public setLocalStaticUdpPortPerStation(stationSerial: string, udpPort : number | null) : boolean
    {
        if(stationSerial !== undefined)
        {
            var res;
            if(this.isStationInConfig(stationSerial) == false)
            {
                rootAddonLogger.info(`Station ${stationSerial} not in config. Try to create new station entry.`);
                res = this.updateWithNewStation(stationSerial);
            }
            else
            {
                res = true;
            }
            if(res)
            {
                res = false;
                var station = this.getStationIterator(stationSerial);
                if(station !== undefined)
                {
                    if(udpPort === undefined)
                    {
                        udpPort = null;
                    }
                    if(this.configJson.stations[station].udpPort != udpPort)
                    {
                        this.configJson.stations[station].udpPort = udpPort;
                        this.hasChanged = true;
                        return true;
                    }
                }
                rootAddonLogger.info(`Station ${stationSerial} not in config.`);
                return false;
            }
        }
        rootAddonLogger.info(`Station ${stationSerial} not in config.`);
        return false;
    }

    /**
     * Saves the P2P releated data for a given station. If the station is currently not in config, it will be created before the config data is populated.
     * The config data will be saved and the config is reloaded.
     * @param stationSerial The serialnumber of the station
     * @param p2pDid The P2P_DID for the P2P connection
     * @param station_ip_address The local ip address of the station
     */
    public setP2PData(stationSerial : string, p2pDid : string, station_ip_address : string) : void
    {
        var res;
        if(this.isStationInConfig(stationSerial) == false)
        {
            res = this.updateWithNewStation(stationSerial);
        }
        else
        {
            res = true;
        }
        if (res)
        {
            this.setP2PDataP2pDid(stationSerial, p2pDid);
            this.setP2PDataStationIpAddress(stationSerial, station_ip_address);

            this.writeConfig(this.configJson);
        }
    }

    /**
     * Get the value for enableing or diableing push service.
     * @returns Boolean for enableing or diableing.
     */
    public getPushServiceActive() : boolean
    {
        if(this.configJson.apiConfig.pushServiceActive !== undefined)
        {
            return this.configJson.apiConfig.pushServiceActive;
        }
        else
        {
            return false;
        }
    }

    /**
     * Set if push service is used.
     * @param pushServiceActive The value if push service is used.
     */
    public setPushServiceActive(pushServiceActive : boolean) : void
    {
        if(this.configJson.apiConfig.pushServiceActive != pushServiceActive)
        {
            this.configJson.apiConfig.pushServiceActive = pushServiceActive;
            this.hasChanged = true;
        }
    }

    /**
     * Get the trusted device name for push connection.
     * @returns The trusted device name.
     */
    public getTrustedDeviceName() : string
    {
        if(this.configJson.pushData.trustedDeviceName !== undefined)
        {
            return this.configJson.pushData.trustedDeviceName;
        }
        else
        {
            return "";
        }
    }

    /**
     * Set the trusted device name for push connection.
     * @param trustedDeviceName The trusted device name
     */
    public setTrustedDeviceName(trustedDeviceName : string) : void
    {
        if(this.configJson.pushData.trustedDeviceName != trustedDeviceName)
        {
            this.configJson.pushData.trustedDeviceName = trustedDeviceName;
            this.setSerialNumber("");
            this.hasChanged = true;
        }
    }

    /**
     * Get the string of seconds as string how long the event shoud remain in state true.
     * @returns A String value contaiong the seconds
     */
    public getEventDurationSeconds() : number
    {
        if(this.configJson.pushData.eventDurationSeconds !== undefined)
        {
            return this.configJson.pushData.eventDurationSeconds;
        }
        else
        {
            return 10;
        }
    }

    /**
     * Set the number of seconds as string how long the event shoud remain in state true.
     * @param eventDurationSeconds A String value contaiong the seconds
     */
    public setEventDurationSeconds(eventDurationSeconds : number) : void
    {
        if(this.configJson.pushData.eventDurationSeconds != eventDurationSeconds)
        {
            this.configJson.pushData.eventDurationSeconds = eventDurationSeconds;
            this.hasChanged = true;
        }
    }

    /**
     * Get the boolean value if invitations should be accepted.
     * @returns A boolean value
     */
    public getAcceptInvitations() : boolean
    {
        if(this.configJson.pushData.acceptInvitations !== undefined)
        {
            return this.configJson.pushData.acceptInvitations;
        }
        else
        {
            return false;
        }
    }

    /**
     * Set the boolean value if invitations should be accepted.
     * @param acceptInvitations A boolean value
     */
    public setAcceptInvitations(acceptInvitations : boolean) : void
    {
        if(this.configJson.pushData.acceptInvitations != acceptInvitations)
        {
            this.configJson.pushData.acceptInvitations = acceptInvitations;
            this.hasChanged = true;
        }
    }

    /**
     * Get the openudid for push connections.
     * @returns The openudid
     */
    public getOpenudid() : string
    {
        if(this.configJson.pushData.openUdid !== undefined)
        {
            return this.configJson.pushData.openUdid;
        }
        else
        {
            return "";
        }
    }

    /**
     * Set the openudid for push connections.
     * @param openudid The openudid to set
     */
    public setOpenudid(openudid : string) : void
    {
        if(this.configJson.pushData.openUdid != openudid)
        {
            this.configJson.pushData.openUdid = openudid;
            this.hasChanged = true;
        }
    }

    /**
     * Get the serial number for push connections.
     * @returns The serial number
     */
    public getSerialNumber() : string
    {
        if(this.configJson.pushData.serialNumber !== undefined)
        {
            return this.configJson.pushData.serialNumber;
        }
        else
        {
            return "";
        }
    }

    /**
     * Set the serial number for push connections.
     * @param serialNumber The serial number to set
     */
    public setSerialNumber(serialNumber : string) : void
    {
        if(this.configJson.pushData.serialNumber != serialNumber)
        {
            this.configJson.pushData.serialNumber = serialNumber;
            this.hasChanged = true;
        }
    }

    /**
     * Checks if the push credentals are stored in config.
     * @returns true if the credentals are set, otherwise false.
     */
    public hasPushCredentials() : boolean
    {
        if(this.getCredentialsCheckinResponse() != null && this.getCredentialsFidResponse() != null && this.getCredentialsGcmResponse() != null)
        {
            return true;
        }
        else
        {
            return false;
        }
    }

    /**
     * Get the fid response credentials for push connections.
     * @returns The fid response credentials.
     */
    public getCredentialsFidResponse() : FidInstallationResponse | null
    {
        if(this.configJson.pushData.fidResponse !== undefined)
        {
            return this.configJson.pushData.fidResponse as FidInstallationResponse;
        }
        else
        {
            return null;
        }
    }

    /**
     * Set the fid response credentials for push connections.
     * @param fidResponse 
     */
    public setCredentialsFidResponse(fidResponse : FidInstallationResponse) : void
    {
        if (this.configJson.pushData.fidResponse as FidInstallationResponse != fidResponse)
        {
            this.configJson.pushData.fidResponse = fidResponse;
            this.hasChanged = true;
        }
    }

    /**
     * Get the checkin response credentials for push connections.
     * @returns The checkin response credentials
     */
    public getCredentialsCheckinResponse() : CheckinResponse | null
    {
        if(this.configJson.pushData.checkinResponse !== undefined)
        {
            return this.configJson.pushData.checkinResponse as CheckinResponse;
        }
        else
        {
            return null;
        }
    }

    /**
     * Set the checkin response credentials for push connections.
     * @param checkinResponse The checkin response credentials
     */
    public setCredentialsCheckinResponse(checkinResponse : CheckinResponse) : void
    {
        if (this.configJson.pushData.checkinResponse as CheckinResponse != checkinResponse)
        {
            this.configJson.pushData.checkinResponse = checkinResponse;
            this.hasChanged = true;
        }
    }

    /**
     * Get the gcm response credentials for push connections.
     * @returns The gcm response credentials
     */
    public getCredentialsGcmResponse() : GcmRegisterResponse | null
    {
        try
        {
            var res: GcmRegisterResponse = {token: this.configJson.pushData.gcmResponseToken}
            return res;
        }
        catch
        {
            return null;
        }
    }

    /**
     * Set the gcm response credentials for push connections.
     * @param gcmResponse the gcm response credentials
     */
    public setCredentialsGcmResponse(gcmResponse : GcmRegisterResponse) : void
    {
        if(this.configJson.pushData.gcmResponseToken != gcmResponse.token)
        {
            this.configJson.pushData.gcmResponseToken = gcmResponse.token;
            this.hasChanged = true;
        }
    }

    /**
     * Get the persistent id credentials for push connections.
     * @returns The persistent id credentials
     */
    public getCredentialsPersistentIds() : string[]
    {
        if(this.configJson.pushData.persistentIds !== undefined)
        {
            return this.configJson.pushData.persistentIds;
        }
        else
        {
            return [];
        }
    }

    /**
     * Set the persistent id credentials for push connections.
     * @param persistentIds The persistent id credentials
     */
    public setCredentialsPersistentIds(persistentIds : string[]) : void
    {
        if(this.configJson.pushData.persistentIds != persistentIds)
        {
            this.configJson.pushData.persistentIds = persistentIds;
            this.hasChanged = true;
        }
    }

    /**
     * Get the country code.
     * @returns The country code
     */
    public getCountry() : string
    {
        if(this.configJson.accountData.country !== undefined)
        {
            return this.configJson.accountData.country;
        }
        else
        {
            return "DE";
        }
    }

    /**
     * Set the country code.
     * @param country The country code.
     */
    public setCountry(country : string) : void
    {
        if(this.configJson.accountData.country != country)
        {
            this.configJson.accountData.country = country;
            this.hasChanged = true;
        }
    }

    /**
     * Get the language code.
     * @returns The language code
     */
    public getLanguage() : string
    {
        if(this.configJson.accountData.language !== undefined)
        {
            return this.configJson.accountData.language;
        }
        else
        {
            return "de";
        }
    }

    /**
     * Set the language code.
     * @param language The language code
     */
    public setLanguage(language : string) : void
    {
        if(this.configJson.accountData.language != language)
        {
            this.configJson.accountData.language = language;
            this.hasChanged = true;
        }
    }

    /**
     * Retrieves the interactions from the config.
     * @returns The integrations.
     */
    public getInteractions(): string | null
    {
        if(this.configJson.interactions !== undefined)
        {
            return this.configJson.interactions;
        }
        return "";
    }

    /**
     * Set the integrations.
     * @param interactions The interactions to set.
     */
    public setInteractions(interactions: string | null): void
    {
        if(this.configJson.interactions !== interactions)
        {
            this.configJson.interactions = interactions;
            this.hasChanged = true;
        }
    }

    /**
     * Remove all integrations.
     */
    public removeInteractions(): void
    {
        this.configJson.interactions = null;
    }
}
