import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { parse } from 'ini';
import { CheckinResponse, FidInstallationResponse, GcmRegisterResponse } from './push/models';
import { Logger } from './utils/logging';

export class Config
{
    private configJson : any;
    private oldConfig : any = undefined;
    private hasChanged : boolean;
    private logger : Logger;
    private taskSaveConfig12h !: NodeJS.Timeout;
    
    /**
     * Constructor, read the config file and provide values to the variables.
     */
    constructor(logger : Logger)
    {
        this.logger = logger;
        this.hasChanged = false;
        if(this.isConfigMigrationFromIniNeeded())
        {
            this.migrateConfigFromIniToJson();
        }
        else
        {
            if(this.isConfigFileAvailable() == false)
            {
                this.configJson = this.createEmptyConfigJson();
                this.hasChanged = true;
                this.writeConfig();
            }
        }
        if(this.existUploadedConfig() == true)
        {
            try
            {
                this.configJson = this.checkConfigFile(this.loadConfigJson("./config.json.upload"));
                this.hasChanged = true;
                this.writeConfig();
                unlinkSync('./config.json.upload');
                this.logger.logInfoBasic("Loaded config from uploaded file 'config.json.upload'. This file has now been removed.");
            }
            catch
            {
                if(this.existUploadedConfig() == true)
                {
                    unlinkSync('./config.json.upload');
                }
                this.logger.logInfoBasic("Error while loading config from uploaded file 'config.json.upload'. This file has now been removed. Going now to load old config.json.");
                if(this.isConfigFileAvailable() == false)
                {
                    this.configJson = this.createEmptyConfigJson();
                    this.writeConfig();
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
                this.writeConfig();
            }
            else
            {
                this.configJson = this.loadConfigJson("./config.json");
            }
        }
        this.updateConfig();
    }

    /**
     * Remove the scheduling for saveConfig12h
     */
    public close()
    {
        if(this.taskSaveConfig12h)
        {
            this.logger.logInfoBasic(`Remove scheduling for saveConfig12h.`);
            clearInterval(this.taskSaveConfig12h);
        }
    }

    /**
     * Checks if config must be migrated to json.
     * @returns true if migration to json is needed, otherwise false.
     */
    private isConfigMigrationFromIniNeeded() : boolean
    {
        if(!existsSync('./config.json') && existsSync('./config.ini'))
        {
            return true;
        }
        else
        {
            return false;
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
        return 12;
    }

    /**
     * Load Config from file.
     */
    private loadConfig() : any
    {
        try
        {
            this.hasChanged = false;
            var filecontent = readFileSync('./config.ini', 'utf-8');
            filecontent = this.updateConfigFileTemplateStage1(filecontent);
            var config = parse(filecontent);
            this.updateConfigFileTemplateStage2(filecontent, config);
            return config;
        }
        catch (ENOENT)
        {
            
        }
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
            this.taskSaveConfig12h = setInterval(async() => { this.writeConfig(); }, (12 * 60 * 60 * 1000));
        }
        catch (ENOENT)
        {
            this.logger.logErrorBasis(`No '${filePath}' available.`);
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
            this.logger.logInfoBasic("Configfile needs Stage1 update. Adding 'config_file_version'.");
            filecontent = "[ConfigFileInfo]\r\nconfig_file_version=0\r\n\r\n" + filecontent;
        }
        return filecontent;
    }

    /**
     * Check and add config entries to the config string after parsed.
     */
    private updateConfigFileTemplateStage2(filecontent : string, config : any) : boolean
    {
        var updated = false;
        
        if(Number.parseInt(config['ConfigFileInfo']['config_file_version']) < 1)
        {
            this.logger.logInfoBasic("Configfile needs Stage2 update to version 1...");
            if(filecontent.indexOf("api_use_system_variables") == -1)
            {
                this.logger.logInfoBasic("  adding 'api_use_system_variables'.");
                filecontent = filecontent.replace("api_https_pkey_string=" + this.getHttpsPkeyString(), "api_https_pkey_string=" + this.getHttpsPkeyString() + "\r\napi_use_system_variables=false");
                config = parse(filecontent);
                updated = true;
            }
            if(filecontent.indexOf("api_camera_default_image") == -1)
            {
                this.logger.logInfoBasic("  adding 'api_camera_default_image'.");
                filecontent = filecontent.replace("api_use_system_variables=" + this.getSystemVariableActive(), "api_use_system_variables=" + this.getSystemVariableActive() + "\r\napi_camera_default_image=");
                config = parse(filecontent);
                updated = true;
            }
            if(filecontent.indexOf("api_camera_default_video") == -1)
            {
                this.logger.logInfoBasic("  adding 'api_camera_default_video'.");
                filecontent = filecontent.replace("api_camera_default_image=" + this.getCameraDefaultImage(), "api_camera_default_image=" + this.getCameraDefaultImage() + "\r\napi_camera_default_video=");
                config = parse(filecontent);
                updated = true;
            }
            updated = true;
            this.logger.logInfoBasic("...Stage2 update to version 1 finished.");
        }
        if(Number.parseInt(config['ConfigFileInfo']['config_file_version']) < 2)
        {
            this.logger.logInfoBasic("Configfile needs Stage2 update to version 2...");
            if(filecontent.indexOf("api_udp_local_static_ports_active") == -1)
            {
                this.logger.logInfoBasic("  adding 'api_udp_local_static_ports_active'.");
                filecontent = filecontent.replace("api_https_pkey_string=" + this.getHttpsPkeyString(), "api_https_pkey_string=" + this.getHttpsPkeyString() + "\r\api_udp_local_static_ports_active=false");
                config = parse(filecontent);
                updated = true;
            }
            updated = true;
            this.logger.logInfoBasic("...Stage2 update to version 2 finished.");
        }
        if(Number.parseInt(config['ConfigFileInfo']['config_file_version']) < 3)
        {
            this.logger.logInfoBasic("Configfile needs Stage2 update to version 3...");
            if(filecontent.indexOf("api_log_level") == -1)
            {
                this.logger.logInfoBasic(" adding 'api_log_level'.");
                filecontent = filecontent.replace("api_camera_default_video=" + this.getCameraDefaultVideo(), "api_camera_default_video=" + this.getCameraDefaultVideo() + "\r\napi_log_level=0");
                config = parse(filecontent);
                updated = true;
            }
            updated = true;
            this.logger.logInfoBasic("...Stage2 update to version 3 finished.");
        }
        if(Number.parseInt(config['ConfigFileInfo']['config_file_version']) < 4)
        {
            this.logger.logInfoBasic("Configfile needs Stage2 update to version 4...");
            if(filecontent.indexOf("api_connection_type") == -1)
            {
                this.logger.logInfoBasic(" adding 'api_connection_type'.");
                filecontent = filecontent.replace("api_udp_local_static_ports_active=", "api_connection_type=1\r\napi_udp_local_static_ports_active=");
                config = parse(filecontent);
                updated = true;
            }
            if(filecontent.indexOf("api_udp_local_static_ports=") > 0)
            {
                this.logger.logInfoBasic(" removing 'api_udp_local_static_ports'.");
                filecontent = filecontent.replace(/^.*api_udp_local_static_ports=.*$/mg, "");
                config = parse(filecontent);
                updated = true;
            }
            updated = true;
            this.logger.logInfoBasic("...Stage2 update to version 4 finished.");
        }
        if(Number.parseInt(config['ConfigFileInfo']['config_file_version']) < 5)
        {
            this.setTokenExpire(0);
            this.logger.logInfoBasic("Configfile needs Stage2 update to version 5...");
            if(filecontent.indexOf("api_update_state_active") == -1)
            {
                this.logger.logInfoBasic(" adding 'api_update_state_active'.");
                filecontent = filecontent.replace("api_log_level=", "api_update_state_active=false\r\napi_log_level=");
                config = parse(filecontent);
                updated = true;
            }
            if(filecontent.indexOf("api_update_state_timespan") == -1)
            {
                this.logger.logInfoBasic(" adding 'api_update_state_timespan'.");
                filecontent = filecontent.replace("api_log_level=", "api_update_state_timespan=15\r\napi_log_level=");
                config = parse(filecontent);
                updated = true;
            }
            if(filecontent.indexOf("api_update_links24_active") == -1)
            {
                this.logger.logInfoBasic(" adding 'api_update_links24_active'.");
                filecontent = filecontent.replace("api_log_level=", "api_update_links24_active=false\r\napi_log_level=");
                config = parse(filecontent);
                updated = true;
            }
            if(filecontent.indexOf("api_update_links_active") == -1)
            {
                this.logger.logInfoBasic(" adding 'api_update_links_active'.");
                filecontent = filecontent.replace("api_log_level=", "api_update_links_active=false\r\napi_log_level=");
                config = parse(filecontent);
                updated = true;
            }
            if(filecontent.indexOf("api_update_links_timespan") == -1)
            {
                this.logger.logInfoBasic(" adding 'api_update_links_timespan'.");
                filecontent = filecontent.replace("api_log_level=", "api_update_links_timespan=15\r\napi_log_level=");
                config = parse(filecontent);
                updated = true;
            }
            updated = true;
            this.logger.logInfoBasic("...Stage2 update to version 5 finished.");
        }
        if(Number.parseInt(config['ConfigFileInfo']['config_file_version']) < 6)
        {
            this.logger.logInfoBasic("Configfile needs Stage2 update to version 6...");
            if(filecontent.indexOf("api_udp_local_static_ports=") > 0)
            {
                this.logger.logInfoBasic(" removing 'api_udp_local_static_ports'.");
                filecontent = filecontent.replace(/^.*api_udp_local_static_ports=.*$/mg, "");
                config = parse(filecontent);
                updated = true;
            }
            if(filecontent.indexOf("api_update_links_only_when_active") == -1)
            {
                this.logger.logInfoBasic(" adding 'api_update_links_only_when_active'.");
                filecontent = filecontent.replace("api_log_level=", "api_update_links_only_when_active=false\r\napi_log_level=");
                config = parse(filecontent);
                updated = true;
            }
            updated = true;
            this.logger.logInfoBasic("...Stage2 update to version 6 finished.");
        }
        if(Number.parseInt(config['ConfigFileInfo']['config_file_version']) < 7)
        {
            this.logger.logInfoBasic("Configfile needs Stage2 update to version 7...");
            if(filecontent.indexOf("api_update_state_active") > 0)
            {
                this.logger.logInfoBasic(" rename 'api_update_state_active' to 'api_update_state_intervall_active'.");
                filecontent = filecontent.replace("api_update_state_active=", "api_update_state_intervall_active=");
                config = parse(filecontent);
                updated = true;
            }
            if(filecontent.indexOf("api_update_state_event_active") == -1)
            {
                this.logger.logInfoBasic(" adding 'api_update_state_event_active'.");
                filecontent = filecontent.replace("api_update_state_intervall_active=", "api_update_state_event_active=false\r\napi_update_state_intervall_active=");
                config = parse(filecontent);
                updated = true;
            }
            updated = true;
            this.logger.logInfoBasic("...Stage2 update to version 7 finished.");
        }
        if(Number.parseInt(config['ConfigFileInfo']['config_file_version']) < 8)
        {
            /*this.logger.logInfoBasic("Configfile needs Stage2 update to version 8...");
            if(this.filecontent.indexOf("location") == -1)
            {
                this.logger.logInfoBasic(" adding 'location'.");
                this.filecontent = this.filecontent.replace(`password=${this.getPassword()}`, `password=${this.getPassword()}\r\nlocation="1"`);
                this.config = parse(this.filecontent);
                updated = true;
            }
            updated = true;
            this.logger.logInfoBasic("...Stage2 update to version 8 finished.");*/
        }
        if(Number.parseInt(config['ConfigFileInfo']['config_file_version']) < 9)
        {
            this.logger.logInfoBasic("Configfile needs Stage2 update to version 9...");
            if(filecontent.indexOf("country") == -1)
            {
                this.logger.logInfoBasic(" adding 'country' and 'language'.");
                filecontent = filecontent.replace(`password=${this.getPassword()}`, `password=${this.getPassword()}\r\ncountry=DE\r\nlanguage=de\r\n\r\n`);
                config = parse(filecontent);
                updated = true;
            }
            if(filecontent.indexOf("[EufyAPIPushData]") == -1)
            {
                this.logger.logInfoBasic(" adding '[EufyAPIPushData]'.");
                filecontent = filecontent.replace(`language=${this.getLanguage()}`, `language=${this.getLanguage()}\r\n\r\n[EufyAPIPushData]\r\ntrusted_device_name=\r\nserial_number=\r\nevent_duration_seconds=10\r\naccept_invitations=false\r\nopen_udid=\r\nfid_response_name=\r\nfid_response_fid=\r\nfid_response_refresh_token=\r\nfid_response_auth_token_token=\r\nfid_response_auth_token_expires_in=\r\nfid_response_auth_token_expires_at=\r\ncheckin_response_stats_ok=\r\ncheckin_response_time_ms=\r\ncheckin_response_android_id=\r\ncheckin_response_security_token=\r\ncheckin_response_version_info=\r\ncheckin_response_device_data_version_info=\r\ngcm_response_token=\r\npersistent_ids=\r\n\r\n`);
                config = parse(filecontent);
                updated = true;
            }
            updated = true;
            this.logger.logInfoBasic("...Stage2 update to version 9 finished.");
        }
        if(Number.parseInt(config['ConfigFileInfo']['config_file_version']) < 10)
        {
            this.logger.logInfoBasic("Configfile needs Stage2 update to version 10...");
            if(filecontent.indexOf("api_use_pushservice") == -1)
            {
                this.logger.logInfoBasic(" adding 'api_use_pushservice'.");
                filecontent = filecontent.replace(`api_log_level=${this.getLogLevel()}`, `api_use_pushservice=false\r\napi_log_level=${this.getLogLevel()}\r\n\r\n`);
                config = parse(filecontent);
                updated = true;
            }
            updated = true;
            this.logger.logInfoBasic("...Stage2 update to version 11 finished.");
        }
        if(Number.parseInt(config['ConfigFileInfo']['config_file_version']) == 10)
        {
            this.logger.logInfoBasic("Configfile needs country and language check...");
            if(this.getCountry() == "")
            {
                this.logger.logInfoBasic(" setting 'country' to standard value.");
                filecontent = filecontent.replace(`country=`, `country=DE`);
                config = parse(filecontent);
                updated = true;
            }
            if(this.getCountry() == "undefined")
            {
                this.logger.logInfoBasic(" setting 'country' to standard value.");
                filecontent = filecontent.replace(`country="undefined"`, `country=DE`);
                config = parse(filecontent);
                updated = true;
            }
            if(this.getLanguage() == "")
            {
                this.logger.logInfoBasic(" setting 'language' to standard value.");
                filecontent = filecontent.replace(`language=`, `language=de`);
                config = parse(filecontent);
                updated = true;
            }
            if(this.getLanguage() == "undefined")
            {
                this.logger.logInfoBasic(" setting 'language' to standard value.");
                filecontent = filecontent.replace(`language=undefined`, `language=de`);
                config = parse(filecontent);
                updated = true;
            }
            updated = true;
            this.logger.logInfoBasic("...country and language check finished.");
            this.logger.logInfoBasic("...Stage2 update to version 11 finished.");
        }

        if(updated)
        {
            config = parse(filecontent);
            config['ConfigFileInfo']['config_file_version'] = this.getConfigFileTemplateVersion();
        }
        return updated;
    }

    /**
     * Write Configuration to file.
     */
    public writeConfig() : string
    {
        if(this.hasChanged == true)
        {
            try
            {
                writeFileSync('./config.json', JSON.stringify(this.configJson));
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
     * Create a empty config object with some default settings.
     * @returns The config object.
     */
    private createEmptyConfigJson() : any
    {
        var config = JSON.parse(`{}`);
        config.configVersion = this.getConfigFileTemplateVersion();

        var accountData = {"eMail": "", "password": "", "encryptedPassword": "", "country": "DE", "language": "de"};
        config.accountData = accountData;

        var tokenData = {"token": "", "tokenExpires": 0};
        config.tokenData = tokenData;

        var pushData = {"trustedDeviceName": "", "serialNumber": "", "eventDurationSeconds": 10, "acceptInvitations": false, "openUdid": "", "fidResponse": "", "checkinResponse": "", "gcmResponseToken": "", "persistentIds": ""};
        config.pushData = pushData;

        var apiConfig = {"httpActive": true, "httpPort": 52789, "httpsActive": true, "httpsPort": 52790, "httpsMethod": "", "httpsPkeyFile": "/usr/local/etc/config/server.pem", "httpsCertFile": "/usr/local/etc/config/server.pem", "httpsPkeyString": "", "connectionTypeP2p": 1, "localStaticUdpPortsActive": false, "systemVariableActive": false, "cameraDefaultImage": "", "cameraDefaultVideo": "", "updateCloudInfoIntervall": 10, "updateDeviceDataIntervall": 10, "stateUpdateEventActive": false, "stateUpdateIntervallActive": false, "stateUpdateIntervallTimespan": 15, "updateLinksActive": true, "updateLinksOnlyWhenArmed": false, "updateLinks24hActive": false, "updateLinksTimespan": 15, "pushServiceActive": false, "logLevel": 0};
        config.apiConfig = apiConfig;

        var stations : [] = [];
        config.stations = stations;

        return config;
    }

    /**
     * Migrates the old config.ini to the new config.json and deletes the config.ini on exit.
     */
    private migrateConfigFromIniToJson() : void
    {
        this.logger.logInfoBasic("Migrating settings to json...")
        var configIni = this.loadConfig();

        this.configJson = this.createEmptyConfigJson();
        
        this.configJson.accountData.eMail = configIni['EufyAPILoginData']['email'];
        this.configJson.accountData.password = configIni['EufyAPILoginData']['password'];
        if(configIni['EufyAPILoginData']['country'] != undefined)
        {
            this.configJson.accountData.country = configIni['EufyAPILoginData']['country'];
        }
        this.configJson.accountData.language = configIni['EufyAPILoginData']['language'];

        this.configJson.tokenData.token = configIni['EufyTokenData']['token'];
        this.configJson.tokenData.tokenExpires = Number.parseInt(configIni['EufyTokenData']['tokenexpires']);

        if(configIni['EufyAPIPushData'] != undefined)
        {
            if(configIni['EufyAPIPushData']['trusted_device_name'] == "eufyclient")
            {
                this.configJson.pushData.trustedDeviceName = "";
            }
            else
            {
                this.configJson.pushData.trustedDeviceName = configIni['EufyAPIPushData']['trusted_device_name'];
            }
            this.configJson.pushData.serialNumber = configIni['EufyAPIPushData']['serial_number'];
            this.configJson.pushData.eventDurationSeconds = Number.parseInt(configIni['EufyAPIPushData']['event_duration_seconds']);
            this.configJson.pushData.acceptInvitations = configIni['EufyAPIPushData']['accept_invitations'];
            this.configJson.pushData.openUdid = configIni['EufyAPIPushData']['open_udid'];
            var fidResp : FidInstallationResponse = {name: configIni['EufyAPIPushData']['fid_response_name'], fid: configIni['EufyAPIPushData']['fid_response_fid'], refreshToken: configIni['EufyAPIPushData']['fid_response_refresh_Token'], authToken: { token: configIni['EufyAPIPushData']['fid_response_auth_token_token'], expiresIn: configIni['EufyAPIPushData']['fid_response_auth_token_expires_in'], expiresAt: Number.parseInt(configIni['EufyAPIPushData']['fid_response_auth_token_expires_at'])}};
            this.configJson.pushData.fidResponse = fidResp;
            var checkinResp : CheckinResponse = {statsOk: configIni['EufyAPIPushData']['checkin_response_stats_ok'], timeMs: configIni['EufyAPIPushData']['checkin_response_time_ms'], androidId: configIni['EufyAPIPushData']['checkin_response_android_id'], securityToken: configIni['EufyAPIPushData']['checkin_response_security_token'], versionInfo: configIni['EufyAPIPushData']['checkin_response_version_info'], deviceDataVersionInfo: configIni['EufyAPIPushData']['checkin_response_device_data_version_info']};
            this.configJson.pushData.checkinResponse = checkinResp;
            this.configJson.pushData.gcmResponseToken = configIni['EufyAPIPushData']['gcm_response_token'];
            this.configJson.pushData.persistentIds = configIni['EufyAPIPushData']['persistent_ids'];
        }

        this.configJson.apiConfig.httpActive = configIni['EufyAPIServiceData']['api_http_active'];
        this.configJson.apiConfig.httpPort = Number.parseInt(configIni['EufyAPIServiceData']['api_http_port']);
        this.configJson.apiConfig.httpsActive = configIni['EufyAPIServiceData']['api_https_active'];
        this.configJson.apiConfig.httpsPort = Number.parseInt(configIni['EufyAPIServiceData']['api_https_port']);
        this.configJson.apiConfig.httpsMethod = configIni['EufyAPIServiceData']['api_https_method'];
        this.configJson.apiConfig.httpsPkeyFile = configIni['EufyAPIServiceData']['api_https_pkey_file'];
        this.configJson.apiConfig.httpsCertFile = configIni['EufyAPIServiceData']['api_https_cert_file'];
        this.configJson.apiConfig.httpsPkeyString = configIni['EufyAPIServiceData']['api_https_pkey_string'];
        this.configJson.apiConfig.connectionTypeP2p = Number.parseInt(configIni['EufyAPIServiceData']['api_connection_type']);
        this.configJson.apiConfig.localStaticUdpPortsActive = configIni['EufyAPIServiceData']['api_udp_local_static_ports_active'];
        this.configJson.apiConfig.systemVariableActive = configIni['EufyAPIServiceData']['api_use_system_variables'];
        this.configJson.apiConfig.cameraDefaultImage = configIni['EufyAPIServiceData']['api_camera_default_image'];
        this.configJson.apiConfig.cameraDefaultVideo = configIni['EufyAPIServiceData']['api_camera_default_video'];
        this.configJson.apiConfig.updateCloudInfoIntervall = 10;
        this.configJson.apiConfig.updateDeviceDataIntervall = 10;
        this.configJson.apiConfig.stateUpdateEventActive = configIni['EufyAPIServiceData']['api_update_state_event_active'];
        this.configJson.apiConfig.stateUpdateIntervallActive = configIni['EufyAPIServiceData']['api_update_state_intervall_active'];
        this.configJson.apiConfig.stateUpdateIntervallTimespan = Number.parseInt(configIni['EufyAPIServiceData']['api_update_state_timespan']);
        this.configJson.apiConfig.updateLinksActive = configIni['EufyAPIServiceData']['api_update_links_active'];
        this.configJson.apiConfig.updateLinksOnlyWhenArmed = configIni['EufyAPIServiceData']['api_update_links_only_when_active'];
        this.configJson.apiConfig.updateLinksTimespan = Number.parseInt(configIni['EufyAPIServiceData']['api_update_links_timespan']);
        if(configIni['EufyAPIServiceData']['api_use_pushservice'] != undefined)
        {
            this.configJson.apiConfig.pushServiceActive = configIni['EufyAPIServiceData']['api_use_pushservice'];
        }
        this.configJson.apiConfig.logLevel = Number.parseInt(configIni['EufyAPIServiceData']['api_log_level']);

        this.hasChanged = true;
        this.writeConfig();
        unlinkSync('./config.ini');
        this.logger.logInfoBasic("...migrating done. Removed old 'config.ini'.");
        this.oldConfig = configIni;
    }

    /**
     * Checks if the config file needs to be updated.
     * @returns A boolean value, true if the config need to be updated, otherwise false.
     */
    private updateConfigNeeded() : boolean
    {
        if(this.configJson.configVersion == this.getConfigFileTemplateVersion())
        {
            return false;
        }
        return false;
    }

    /**
     * Update the config.json file to the most recent version.
     * @returns true, if the config was updated, otherwise false.
     */
    private updateConfig() : boolean
    {
        if(this.configJson.configVersion < this.getConfigFileTemplateVersion())
        {
            var updated = false;
            if(this.configJson.configVersion == 11)
            {
                this.logger.logInfoBasic("Configfile needs Stage2 update to version 12...");
                if(this.configJson.apiConfig.updateCloudInfoIntervall == undefined)
                {
                    this.logger.logInfoBasic(" adding 'updateCloudInfoIntervall'.");
                    this.configJson.apiConfig.updateCloudInfoIntervall = 10;
                    updated = true;
                }
                if(this.configJson.apiConfig.updateDeviceDataIntervall == undefined)
                {
                    this.logger.logInfoBasic(" adding 'updateDeviceDataIntervall'.");
                    this.configJson.apiConfig.updateDeviceDataIntervall = 10;
                    updated = true;
                }
            }
            if(updated == true)
            {
                this.configJson = this.checkConfigFile(this.configJson);
                this.hasChanged = true;
                this.writeConfig();
            }
            return true;
        }
        else
        {
            return false;
        }
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
        if(configJson.accountData.country !== undefined)
        {
            newConfigJson.accountData.country = configJson.accountData.country;
        }
        if(configJson.accountData.language !== undefined)
        {
            newConfigJson.accountData.language = configJson.accountData.language;
        }
        
        if(configJson.tokenData.token !== undefined)
        {
            newConfigJson.tokenData.token = configJson.tokenData.token;
        }
        if(configJson.tokenData.tokenExpires !== undefined)
        {
            newConfigJson.tokenData.tokenExpires = configJson.tokenData.tokenExpires;
        }

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
        if(configJson.apiConfig.logLevel !== undefined)
        {
            newConfigJson.apiConfig.logLevel = configJson.apiConfig.logLevel;
        }

        if(configJson.stations !== undefined)
        {
            newConfigJson.stations = configJson.stations;
        }

        return newConfigJson;
    }

    /**
     * Checks if the old config.ini contains settings for a given station.
     * @param stationSerial The serial of the station the check is to perform.
     * @returns true, if migrarion is needed, otherwise no.
     */
    private checkStationMigrationToJsonIsNeeded(stationSerial : string) : boolean
    {
        if(this.oldConfig === undefined || this.oldConfig['EufyP2PData_' + stationSerial] === undefined)
        {
            return false;
        }
        else
        {
            return true;
        }
    }

    /**
     * Migrate a given station from the old config.ini to the new config.json.
     * @param stationSerial The serial of the station the migration is to perform.
     * @returns 
     */
    private migrateStationToJson(stationSerial : string) : any
    {
        if(this.oldConfig !== undefined)
        {
            var p2pDid, stationIpAddress, udpPort;
            if(this.oldConfig['EufyP2PData_' + stationSerial]['p2p_did'] === undefined)
            {
                p2pDid = "";
            }
            else
            {
                p2pDid = this.oldConfig['EufyP2PData_' + stationSerial]['p2p_did'];
            }
            if(this.oldConfig['EufyP2PData_' + stationSerial]['base_ip_address'] === undefined)
            {
                stationIpAddress = "";
            }
            else
            {
                stationIpAddress = this.oldConfig['EufyP2PData_' + stationSerial]['base_ip_address'];
            }
            if(this.oldConfig['EufyP2PData_' + stationSerial]['udp_ports'] === undefined || this.oldConfig['EufyP2PData_' + stationSerial]['udp_ports'] == "")
            {
                udpPort = null;
            }
            else
            {
                udpPort = Number.parseInt(this.oldConfig['EufyP2PData_' + stationSerial]['udp_ports']);
            }
            return {"stationSerial": stationSerial, "p2pDid": p2pDid, "stationIpAddress": stationIpAddress, "udpPort": udpPort};
        }
        return null;
    }

    /**
     * Add section for a new station.
     * @param stationSerial Serialnumber of the new station.
     */
    private updateWithNewStation(stationSerial : string) : boolean
    {
        this.logger.logInfoBasic(`Adding station ${stationSerial} to settings.`);
        var station;
        if(this.checkStationMigrationToJsonIsNeeded(stationSerial) == false)
        {
            station = {"stationSerial": stationSerial, "p2pDid": "", "stationIpAddress": "", "udpPort": ""};
        }
        else
        {
            station = this.migrateStationToJson(stationSerial);
        }

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
                if(this.configJson.stations[station] !== undefined && this.configJson.stations[station].stationSerial ==  stationSerial)
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
        if(this.configJson.configVersion != undefined)
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
        if(this.configJson.accountData.eMail != undefined)
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
     * Get the password for the eufy security account.
     */
    public getPassword() : string
    {
        if(this.configJson.accountData.password != undefined)
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
     * Returns true if the connection type for connecting with station.
     */
    public getConnectionType() : number
    {
        if(this.configJson.apiConfig.connectionTypeP2p != undefined)
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
        if(this.configJson.apiConfig.localStaticUdpPortsActive != undefined)
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
    public setLocalStaticUdpPorts(ports : string[][]) : boolean
    {
        var err : boolean = false;
        if(ports)
        {
            var array : string[];
            for (array of ports)
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
                if(this.setLocalStaticUdpPortPerStation(array[0], portNumber) == false)
                {
                    err = true;
                }
            }
        }
        if(err == false)
        {
            return true;
        }
        else
        {
            return false;
        }
    }

    /**
     * Get a boolean value if the api shoud set system variables on the CCU.
     */
    public getSystemVariableActive() : boolean
    {
        if(this.configJson.apiConfig.systemVariableActive != undefined)
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
        if(this.configJson.apiConfig.httpActive != undefined)
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
        if(this.configJson.apiConfig.httpPort != undefined)
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
        if(this.configJson.apiConfig.httpsActive != undefined)
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
        if(this.configJson.apiConfig.httpsPort != undefined)
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
        if(this.configJson.apiConfig.httpsMethod != undefined)
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
        if(this.configJson.apiConfig.httpsPkeyFile != undefined)
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
        if(this.configJson.apiConfig.httpsCertFile != undefined)
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
        if(this.configJson.apiConfig.httpsPkeyString != undefined)
        {
            return this.configJson.apiConfig.httpsPkeyString;
        }
        else
        {
            return "";
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
        if(this.configJson.apiConfig.cameraDefaultImage != undefined)
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
        if(this.configJson.apiConfig.cameraDefaultVideo != undefined)
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
        if(this.configJson.apiConfig.updateCloudInfoIntervall != undefined)
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
        if(this.configJson.apiConfig.updateDeviceDataIntervall != undefined)
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
        if(this.configJson.apiConfig.stateUpdateEventActive != undefined)
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
        if(this.configJson.apiConfig.stateUpdateIntervallActive != undefined)
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
        if(this.configJson.apiConfig.stateUpdateIntervallTimespan != undefined)
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
        if(this.configJson.apiConfig.updateLinksActive != undefined)
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
        if(this.configJson.apiConfig.updateLinksTimespan != undefined)
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
        if(this.configJson.apiConfig.updateLinksOnlyWhenArmed != undefined)
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
     * Returns the log level.
     */
    public getLogLevel() : number
    {
        if(this.configJson.apiConfig.logLevel != undefined)
        {
            return this.configJson.apiConfig.logLevel;
        }
        else
        {
            return 0;
        }
    }

    /**
     * Set the log level.
     * @param logLevel The log level as number to set
     */
    public setLogLevel(logLevel : number) : void
    {
        if(this.configJson.apiConfig.logLevel != logLevel)
        {
            this.configJson.apiConfig.logLevel = logLevel;
            this.hasChanged = true;
        }
    }

    /**
     * Get the token for login to the eufy security account.
     */
    public getToken() : string
    {
        if(this.configJson.tokenData.token != undefined)
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
        if(this.configJson.tokenData.tokenExpires != undefined)
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
        if(station != undefined && this.configJson.stations != undefined && this.configJson.stations[station] != undefined && this.configJson.stations[station].p2pDid != undefined)
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
        if(station != undefined && this.configJson.stations != undefined && this.configJson.stations[station] != undefined && this.configJson.stations[station].stationIpAddress != undefined)
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
        if(station != undefined && this.configJson.stations != undefined && this.configJson.stations[station] != undefined && this.configJson.stations[station].udpPort != undefined && this.configJson.stations[station].udpPort != null)
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
        if(stationSerial != undefined)
        {
            var res;
            if(this.isStationInConfig(stationSerial) == false)
            {
                this.logger.logInfo(1, `Station ${stationSerial} not in config.`);
                res = this.updateWithNewStation(stationSerial);
            }
            else
            {
                res = true;
            }
            if(res)
            {
                if(udpPort != undefined)
                {
                    var station = this.getStationIterator(stationSerial);
                    if(station !== undefined)
                    {
                        if(this.configJson.stations[station].udpPort != udpPort)
                        {
                            this.configJson.stations[station].udpPort = udpPort;
                            this.hasChanged = true;
                            res = true;
                        }
                    }
                    res = false;
                }
                return res;
            }
        }
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

            this.writeConfig();
            this.loadConfig();
        }
    }

    /**
     * Get the value for enableing or diableing push service.
     * @returns Boolean for enableing or diableing.
     */
    public getPushServiceActive() : boolean
    {
        if(this.configJson.apiConfig.pushServiceActive != undefined)
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
        if(this.configJson.pushData.trustedDeviceName != undefined)
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
        if(this.configJson.pushData.eventDurationSeconds != undefined)
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
        if(this.configJson.pushData.acceptInvitations != undefined)
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
        if(this.configJson.pushData.openUdid != undefined)
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
        if(this.configJson.pushData.serialNumber != undefined)
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
        if(this.configJson.pushData.fidResponse != undefined)
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
        if(this.configJson.pushData.checkinResponse != undefined)
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
        if(this.configJson.pushData.persistentIds != undefined)
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
        if(this.configJson.accountData.country != undefined)
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
        if(this.configJson.accountData.language != undefined)
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
}
