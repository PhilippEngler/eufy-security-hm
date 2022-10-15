import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { parse, stringify } from 'ini';
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
        if(this.isMigrationNeeded())
        {
            this.migrateConfigToJson();
        }
        else
        {
            if(this.isConfigFileAvailable() == false)
            {
                this.configJson = this.createEmptyConfigJson();
                this.writeConfig();
            }
        }
        this.loadConfigJson();
    }

    private isMigrationNeeded() : boolean
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

    private isConfigFileAvailable() : boolean
    {
        if(existsSync('./config.json'))
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
        return 11;
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

    private loadConfigJson() : void
    {
        try
        {
            this.hasChanged = false;
            this.configJson = JSON.parse(readFileSync('./config.json', 'utf-8'));
            this.taskSaveConfig12h = setInterval(async() => { this.writeConfig(); }, (12 * 60 * 60 * 1000));
        }
        catch (ENOENT)
        {
            this.logger.logErrorBasis("No 'config.json' available.");
        }
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
                filecontent = filecontent.replace("api_https_pkey_string=" + this.getApiKeyAsString(), "api_https_pkey_string=" + this.getApiKeyAsString() + "\r\napi_use_system_variables=false");
                config = parse(filecontent);
                updated = true;
            }
            if(filecontent.indexOf("api_camera_default_image") == -1)
            {
                this.logger.logInfoBasic("  adding 'api_camera_default_image'.");
                filecontent = filecontent.replace("api_use_system_variables=" + this.getApiUseSystemVariables(), "api_use_system_variables=" + this.getApiUseSystemVariables() + "\r\napi_camera_default_image=");
                config = parse(filecontent);
                updated = true;
            }
            if(filecontent.indexOf("api_camera_default_video") == -1)
            {
                this.logger.logInfoBasic("  adding 'api_camera_default_video'.");
                filecontent = filecontent.replace("api_camera_default_image=" + this.getApiCameraDefaultImage(), "api_camera_default_image=" + this.getApiCameraDefaultImage() + "\r\napi_camera_default_video=");
                config = parse(filecontent);
                updated = true;
            }
            updated = true;
            this.logger.logInfoBasic("...Stage2 update to version 1 finished.");
        }
        if(Number.parseInt(config['ConfigFileInfo']['config_file_version']) < 2)
        {
            this.logger.logInfoBasic("Configfile needs Stage2 update to version 2...");
            /*if(this.filecontent.indexOf("api_udp_local_static_ports") == -1)
            {
                this.logger.logInfoBasic(" adding 'api_udp_local_static_ports'.");
                this.filecontent = this.filecontent.replace("api_https_pkey_string=" + this.getApiKeyAsString(), "api_https_pkey_string=" + this.getApiKeyAsString() + "\r\napi_udp_local_static_ports=52789,52790");
                this.config = parse(this.filecontent);
                updated = true;
            }*/
            if(filecontent.indexOf("api_udp_local_static_ports_active") == -1)
            {
                this.logger.logInfoBasic("  adding 'api_udp_local_static_ports_active'.");
                filecontent = filecontent.replace("api_https_pkey_string=" + this.getApiKeyAsString(), "api_https_pkey_string=" + this.getApiKeyAsString() + "\r\api_udp_local_static_ports_active=false");
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
                filecontent = filecontent.replace("api_camera_default_video=" + this.getApiCameraDefaultVideo(), "api_camera_default_video=" + this.getApiCameraDefaultVideo() + "\r\napi_log_level=0");
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
                filecontent = filecontent.replace(`language=${this.getLanguage()}`, `language=${this.getLanguage()}\r\n\r\n[EufyAPIPushData]\r\ntrusted_device_name=eufyclient\r\nserial_number=\r\nevent_duration_seconds=10\r\naccept_invitations=false\r\nopen_udid=\r\nfid_response_name=\r\nfid_response_fid=\r\nfid_response_refresh_token=\r\nfid_response_auth_token_token=\r\nfid_response_auth_token_expires_in=\r\nfid_response_auth_token_expires_at=\r\ncheckin_response_stats_ok=\r\ncheckin_response_time_ms=\r\ncheckin_response_android_id=\r\ncheckin_response_security_token=\r\ncheckin_response_version_info=\r\ncheckin_response_device_data_version_info=\r\ngcm_response_token=\r\npersistent_ids=\r\n\r\n`);
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
                filecontent = filecontent.replace(`api_log_level=${this.getApiLogLevel()}`, `api_use_pushservice=false\r\napi_log_level=${this.getApiLogLevel()}\r\n\r\n`);
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

        var apiConfig = {"apiHttpActive": true, "apiHttpPort": 52789, "apiHttpsActive": true, "apiHttpsPort": 52790, "apiHttpsMethod": "", "apiHttpsPkeyFile": "/usr/local/etc/config/server.pem", "apiHttpsCertFile": "/usr/local/etc/config/server.pem", "apiHttpsPkeyString": "", "apiConnectionType": 1, "apiUdpLocalStaticPortsActive": false, "apiUseSystemVariables": false, "apiCameraDefaultImage": "", "apiCameraDefaultVideo": "", "apiUpdateStateEventActive": false, "apiUpdateStateIntervallActive": false, "apiUpdateStateTimespan": 15, "apiUpdateLinksActive": true, "apiUpdateLinksOnlyWhenArmed": false, "apiUpdateLinks24Active": false, "apiUpdateLinksTimespan": 15, "apiUsePush": false, "apiLogLevel": 0};
        config.apiConfig = apiConfig;

        var stations : [] = [];
        config.stations = stations;

        return config;
    }

    private migrateConfigToJson() : void
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
            this.configJson.pushData.trustedDeviceName = configIni['EufyAPIPushData']['trusted_device_name'];
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

        this.configJson.apiConfig.apiHttpActive = configIni['EufyAPIServiceData']['api_http_active'];
        this.configJson.apiConfig.apiHttpPort = Number.parseInt(configIni['EufyAPIServiceData']['api_http_port']);
        this.configJson.apiConfig.apiHttpsActive = configIni['EufyAPIServiceData']['api_https_active'];
        this.configJson.apiConfig.apiHttpsPort = Number.parseInt(configIni['EufyAPIServiceData']['api_https_port']);
        this.configJson.apiConfig.apiHttpsMethod = configIni['EufyAPIServiceData']['api_https_method'];
        this.configJson.apiConfig.apiHttpsPkeyFile = configIni['EufyAPIServiceData']['api_https_pkey_file'];
        this.configJson.apiConfig.apiHttpsCertFile = configIni['EufyAPIServiceData']['api_https_cert_file'];
        this.configJson.apiConfig.apiHttpsPkeyString = configIni['EufyAPIServiceData']['api_https_pkey_string'];
        this.configJson.apiConfig.apiConnectionType = Number.parseInt(configIni['EufyAPIServiceData']['api_connection_type']);
        this.configJson.apiConfig.apiUdpLocalStaticPortsActive = configIni['EufyAPIServiceData']['api_udp_local_static_ports_active'];
        this.configJson.apiConfig.apiUseSystemVariables = configIni['EufyAPIServiceData']['api_use_system_variables'];
        this.configJson.apiConfig.apiCameraDefaultImage = configIni['EufyAPIServiceData']['api_camera_default_image'];
        this.configJson.apiConfig.apiCameraDefaultVideo = configIni['EufyAPIServiceData']['api_camera_default_video'];
        this.configJson.apiConfig.apiUpdateStateEventActive = configIni['EufyAPIServiceData']['api_update_state_event_active'];
        this.configJson.apiConfig.apiUpdateStateIntervallActive = configIni['EufyAPIServiceData']['api_update_state_intervall_active'];
        this.configJson.apiConfig.apiUpdateStateTimespan = Number.parseInt(configIni['EufyAPIServiceData']['api_update_state_timespan']);
        this.configJson.apiConfig.apiUpdateLinksActive = configIni['EufyAPIServiceData']['api_update_links_active'];
        this.configJson.apiConfig.apiUpdateLinksOnlyWhenArmed = configIni['EufyAPIServiceData']['api_update_links_only_when_active'];
        this.configJson.apiConfig.apiUpdateLinksTimespan = Number.parseInt(configIni['EufyAPIServiceData']['api_update_links_timespan']);
        if(configIni['EufyAPIServiceData']['api_use_pushservice'] != undefined)
        {
            this.configJson.apiConfig.apiUsePush = configIni['EufyAPIServiceData']['api_use_pushservice'];
        }
        this.configJson.apiConfig.apiLogLevel = Number.parseInt(configIni['EufyAPIServiceData']['api_log_level']);

        this.hasChanged = true;
        this.writeConfig();
        unlinkSync('./config.ini');
        this.logger.logInfoBasic("...migrating done. Removed old 'config.ini'.");
        this.oldConfig = configIni;
    }

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
            if(this.oldConfig['EufyP2PData_' + stationSerial]['udp_ports'] === undefined)
            {
                udpPort = 0;
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
     * Get the Username/Email-Address of the eufy security account.
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
     * Set the Username/Email-Address for the eufy security account.
     * @param email The Username/Email to set.
     */
    public setEmailAddress(email : string) : void
    {
        if(this.configJson.accountData.eMail != email)
        {
            this.configJson.accountData.eMail = email;
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
        if(this.configJson.apiConfig.apiConnectionType != undefined)
        {
            return this.configJson.apiConfig.apiConnectionType;
        }
        else
        {
            return -1;
        }
    }
 
    /**
     * Sets true, if static udp ports should be used otherwise false.
     * @param connectionType Boolean value.
     */
    public setConnectionType(connectionType : number) : void
    {
        if(this.configJson.apiConfig.apiConnectionType != connectionType)
        {
            this.configJson.apiConfig.apiConnectionType = connectionType;
            this.hasChanged = true;
        }
    }

    /**
     * Returns true if the static udp ports should be used otherwise false.
     */
    public getUseUdpLocalPorts() : boolean
    {
        if(this.configJson.apiConfig.apiUdpLocalStaticPortsActive != undefined)
        {
            return this.configJson.apiConfig.apiUdpLocalStaticPortsActive;
        }
        else
        {
            return false;
        }
    }

    /**
     * Sets true, if static udp ports should be used otherwise false.
     * @param useUdpLocalStaticPorts Boolean value.
     */
    public setUseUdpLocalPorts(useUdpLocalStaticPorts : boolean) : void
    {
        if(this.configJson.apiConfig.apiUdpLocalStaticPortsActive != useUdpLocalStaticPorts)
        {
            this.configJson.apiConfig.apiUdpLocalStaticPortsActive = useUdpLocalStaticPorts;
            this.hasChanged = true;
        }
    }

    /**
     * Set the udp static ports for local communication.
     * @param ports A string with the ports splitted by a comma.
     */
    public setUdpLocalPorts(ports : string[][]) : boolean
    {
        var err : boolean = false;
        if(ports)
        {
            var array : string[];
            for (array of ports)
            {
                if(this.setUdpLocalPortPerStation(array[0], Number.parseInt(array[1])) == false)
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
    public getApiUseSystemVariables() : boolean
    {
        if(this.configJson.apiConfig.apiUseSystemVariables != undefined)
        {
            return this.configJson.apiConfig.apiUseSystemVariables;
        }
        else
        {
            return false;
        }
    }

    /**
     * Set a boolean value if the api shoud set system variables on the CCU.
     * @param apiusesystemvariables Set system variables on the CCU.
     */
    public setApiUseSystemVariables(apiusesystemvariables : boolean) : void
    {
        if(this.configJson.apiConfig.apiUseSystemVariables != apiusesystemvariables)
        {
            this.configJson.apiConfig.apiUseSystemVariables = apiusesystemvariables;
            this.hasChanged = true;
        }
    }

    /**
     * Get weather http should be used for api.
     */
    public getApiUseHttp() : boolean
    {
        if(this.configJson.apiConfig.apiHttpActive != undefined)
        {
            return this.configJson.apiConfig.apiHttpActive;
        }
        else
        {
            return false;
        }
    }

    /**
     * Set weather http sould be used for api.
     * @param apiusehttp Use http for the api.
     */
    public setApiUseHttp(apiusehttp : boolean) : void
    {
        if(this.configJson.apiConfig.apiHttpActive != apiusehttp)
        {
            this.configJson.apiConfig.apiHttpActive = apiusehttp;
            this.hasChanged = true;
        }
    }

    /**
     * Get the port for the webserver (HTTP) for the api.
     */
    public getApiPortHttp() : number
    {
        if(this.configJson.apiConfig.apiHttpPort != undefined)
        {
            return this.configJson.apiConfig.apiHttpPort;
        }
        else
        {
            return 0;
        }
    }

    /**
     * Set the port for the webserver (HTTP) for the api.
     * @param apiport The port the api should be accessable.
     */
    public setApiPortHttp(apiport : number) : void
    {
        if(this.configJson.apiConfig.apiHttpPort != apiport)
        {
            this.configJson.apiConfig.apiHttpPort = apiport;
            this.hasChanged = true;
        }
    }

    /**
     * Get weather https should be used for api.
     */
    public getApiUseHttps() : boolean
    {
        if(this.configJson.apiConfig.apiHttpsActive != undefined)
        {
            return this.configJson.apiConfig.apiHttpsActive;
        }
        else
        {
            return false;
        }
    }

    /**
     * Set weather https sould be used for api.
     * @param apiport Use https for the api.
     */
    public setApiUseHttps(apiusehttps : boolean) : void
    {
        if(this.configJson.apiConfig.apiHttpsActive != apiusehttps)
        {
            this.configJson.apiConfig.apiHttpsActive = apiusehttps;
            this.hasChanged = true;
        }
    }

    /**
     * Get the port for the webserver (HTTPS) for the api.
     */
    public getApiPortHttps() : number
    {
        if(this.configJson.apiConfig.apiHttpsPort != undefined)
        {
            return this.configJson.apiConfig.apiHttpsPort;
        }
        else
        {
            return 0;
        }
    }

    /**
     * Set the port for the webserver (HTTPS) for the api.
     * @param apiport The port the api should be accessable.
     */
    public setApiPortHttps(apiport : number) : void
    {
        if(this.configJson.apiConfig.apiHttpsPort != apiport)
        {
            this.configJson.apiConfig.apiHttpsPort = apiport;
            this.hasChanged = true;
        }
    }

    /**
     * Returns the method used for https.
     */
    public getApiMethodHttps() : string
    {
        if(this.configJson.apiConfig.apiHttpsMethod != undefined)
        {
            return this.configJson.apiConfig.apiHttpsMethod;
        }
        else
        {
            return "";
        }
    }

    /**
     * Set the method used for https.
     * @param apimethod The method for https.
     */
    public setApiMethodHttps(apimethod : string) : void
    {
        if(this.configJson.apiConfig.apiHttpsMethod != apimethod)
        {
            this.configJson.apiConfig.apiHttpsMethod = apimethod;
            this.hasChanged = true;
        }
    }

    /**
     * Get the key for https.
     */
    public getApiKeyFileHttps() : string
    {
        if(this.configJson.apiConfig.apiHttpsPkeyFile != undefined)
        {
            return this.configJson.apiConfig.apiHttpsPkeyFile;
        }
        else
        {
            return "";
        }
    }

    /**
     * Set the key for https.
     * @param apipkey The path to the key file for https.
     */
    public setApiKeyFileHttps(apipkey : string) : void
    {
        if(this.configJson.apiConfig.apiHttpsPkeyFile != apipkey)
        {
            this.configJson.apiConfig.apiHttpsPkeyFile = apipkey;
            this.hasChanged = true;
        }
    }

    /**
     * Returns the cert file for https.
     */
    public getApiCertFileHttps() : string
    {
        if(this.configJson.apiConfig.apiHttpsCertFile != undefined)
        {
            return this.configJson.apiConfig.apiHttpsCertFile;
        }
        else
        {
            return "";
        }
    }

    /**
     * Set the cert for https.
     * @param apicert The cert file for https.
     */
    public setApiCertFileHttps(apicert : string) : void
    {
        if(this.configJson.apiConfig.apiHttpsCertFile != apicert)
        {
            this.configJson.apiConfig.apiHttpsCertFile = apicert;
            this.hasChanged = true;
        }
    }

    /**
     * Get the key as string for https.
     */
    public getApiKeyAsString() : string
    {
        if(this.configJson.apiConfig.apiHttpsPkeyString != undefined)
        {
            return this.configJson.apiConfig.apiHttpsPkeyString;
        }
        else
        {
            return "";
        }
    }

    /**
     * Set the key as string for https.
     * @param apikeyasstring The key for https as string.
     */
    public setApiKeyAsString(apikeyasstring : string) : void
    {
        if(this.configJson.apiConfig.apiHttpsPkeyString != apikeyasstring)
        {
            this.configJson.apiConfig.apiHttpsPkeyString = apikeyasstring;
            this.hasChanged = true;
        }
    }

    /**
     * Get the default image for cameras.
     */
    public getApiCameraDefaultImage() : string
    {
        if(this.configJson.apiConfig.apiCameraDefaultImage != undefined)
        {
            return this.configJson.apiConfig.apiCameraDefaultImage;
        }
        else
        {
            return "";
        }
    }

    /**
     * Set the default image for cameras.
     * @param apicameradefaultimage The path to the default camera image.
     */
    public setApiCameraDefaultImage(apicameradefaultimage : string) : void
    {
        if(this.configJson.apiConfig.apiCameraDefaultImage != apicameradefaultimage)
        {
            this.configJson.apiConfig.apiCameraDefaultImage = apicameradefaultimage;
            this.hasChanged = true;
        }
    }

    /**
     * Get the default video for cameras.
     */
    public getApiCameraDefaultVideo() : string
    {
        if(this.configJson.apiConfig.apiCameraDefaultImage != undefined)
        {
            return this.configJson.apiConfig.apiCameraDefaultVideo;
        }
        else
        {
            return "";
        }
    }

    /**
     * Set the default video for cameras.
     * @param apicameradefaultvideo The path to the default camera video.
     */
    public setApiCameraDefaultVideo(apicameradefaultvideo : string) : void
    {
        if(this.configJson.apiConfig.apiCameraDefaultVideo != apicameradefaultvideo)
        {
            this.configJson.apiConfig.apiCameraDefaultVideo = apicameradefaultvideo;
            this.hasChanged = true;
        }
    }

    /**
     * Determines if the updated state runs by event.
     */
    public getApiUseUpdateStateEvent() : boolean
    {
        if(this.configJson.apiConfig.apiUpdateStateEventActive != undefined)
        {
            return this.configJson.apiConfig.apiUpdateStateEventActive;
        }
        else
        {
            return false;
        }
    }

    /**
     * Set the value for update state eventbased.
     * @param apiuseupdatestateevent The value if the state should updated eventbased.
     */
    public setApiUseUpdateStateEvent(apiuseupdatestateevent : boolean) : void
    {
        if(this.configJson.apiConfig.apiUpdateStateEventActive != apiuseupdatestateevent)
        {
            this.configJson.apiConfig.apiUpdateStateEventActive = apiuseupdatestateevent;
            this.hasChanged = true;
        }
    }

    /**
     * Determines if the updated state runs scheduled.
     */
    public getApiUseUpdateStateIntervall() : boolean
    {
        if(this.configJson.apiConfig.apiUpdateStateIntervallActive != undefined)
        {
            return this.configJson.apiConfig.apiUpdateStateIntervallActive;
        }
        else
        {
            return false;
        }
    }

    /**
     * Set the value for update state scheduled.
     * @param apiuseupdatestate The value if the state should updated scheduled.
     */
    public setApiUseUpdateStateIntervall(apiuseupdatestateintervall : boolean) : void
    {
        if(this.configJson.apiConfig.apiUpdateStateIntervallActive != apiuseupdatestateintervall)
        {
            this.configJson.apiConfig.apiUpdateStateIntervallActive = apiuseupdatestateintervall;
            this.hasChanged = true;
        }
    }

    /**
     * Returns the time between runs of two scheduled tasks for update state.
     */
    public getApiUpdateStateTimespan() : number
    {
        if(this.configJson.apiConfig.apiUpdateStateTimespan != undefined)
        {
            return this.configJson.apiConfig.apiUpdateStateTimespan;
        }
        else
        {
            return 15;
        }
    }

    /**
     * Set the value for the time between runs of two scheduled tasks for update state. 
     * @param apiupdatestatetimespan The time in minutes.
     */
    public setApiUpdateStateTimespan(apiupdatestatetimespan : number) : void
    {
        if(this.configJson.apiConfig.apiUpdateStateTimespan != apiupdatestatetimespan)
        {
            this.configJson.apiConfig.apiUpdateStateTimespan = apiupdatestatetimespan;
            this.hasChanged = true;
        }
    }

    /**
     * Determines if the updated links runs scheduled.
     */
    public getApiUseUpdateLinks() : boolean
    {
        if(this.configJson.apiConfig.apiUpdateLinksActive != undefined)
        {
            return this.configJson.apiConfig.apiUpdateLinksActive;
        }
        else
        {
            return false;
        }
    }

    /**
     * Set the value for update links scheduled.
     * @param apiuseupdatestate The value if the links should updated scheduled.
     */
    public setApiUseUpdateLinks(apiuseupdatelinks : boolean) : void
    {
        if(this.configJson.apiConfig.apiUpdateLinksActive != apiuseupdatelinks)
        {
            this.configJson.apiConfig.apiUpdateLinksActive = apiuseupdatelinks;
            this.hasChanged = true;
        }
    }

    /**
     * Returns the time between runs of two scheduled tasks for update state.
     */
    public getApiUpdateLinksTimespan() : number
    {
        if(this.configJson.apiConfig.apiUpdateLinksTimespan != undefined)
        {
            return this.configJson.apiConfig.apiUpdateLinksTimespan;
        }
        else
        {
            return 15;
        }
    }

    /**
     * Set the value for the time between runs of two scheduled tasks for update links.
     * @param apiupdatestatetimespan The time in minutes.
     */
    public setApiUpdateLinksTimespan(apiupdatelinkstimespan : number) : void
    {
        if(this.configJson.apiConfig.apiUpdateLinksTimespan != apiupdatelinkstimespan)
        {
            this.configJson.apiConfig.apiUpdateLinksTimespan = apiupdatelinkstimespan;
            this.hasChanged = true;
        }
    }

    /**
     * Return weather the api should only refresh links when eufy state is other than off or deactivated.
     */
    public getApiUpdateLinksOnlyWhenArmed() : boolean
    {
        if(this.configJson.apiConfig.apiUpdateLinksOnlyWhenArmed != undefined)
        {
            return this.configJson.apiConfig.apiUpdateLinksOnlyWhenArmed;
        }
        else
        {
            return false;
        }
    }

    /**
     * Set the value the api should only refresh links when eufy state is other than off or deactivated
     * @param apiupdatelinksonlywhenactive true for not refreshing links during off or deactivated, otherwise false.
     */
    public setApiUpdateLinksOnlyWhenArmed(apiupdatelinksonlywhenactive : boolean)
    {
        if(this.configJson.apiConfig.apiUpdateLinksOnlyWhenArmed != apiupdatelinksonlywhenactive)
        {
            this.configJson.apiConfig.apiUpdateLinksOnlyWhenArmed = apiupdatelinksonlywhenactive;
            this.hasChanged = true;
        }
    }

    /**
     * Returns the log level.
     */
    public getApiLogLevel() : number
    {
        if(this.configJson.apiConfig.apiLogLevel != undefined)
        {
            return this.configJson.apiConfig.apiLogLevel;
        }
        else
        {
            return 0;
        }
    }

    /**
     * Set the log level.
     * @param apiloglevel The log level as number to set
     */
    public setApiLogLevel(apiloglevel : number) : void
    {
        if(this.configJson.apiConfig.apiLogLevel != apiloglevel)
        {
            this.configJson.apiConfig.apiLogLevel = apiloglevel;
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
    public setToken(token : string) : void
    {
        if(this.configJson.tokenData.token != token)
        {
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
    public setTokenExpire(tokenexpire : number) : void
    {
        if(this.configJson.tokenData.tokenExpires != tokenexpire)
        {
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
    public getUdpLocalPortsPerStation(stationSerial : string) : number
    {
        var station = this.getStationIterator(stationSerial);
        if(station != undefined && this.configJson.stations != undefined && this.configJson.stations[station] != undefined && this.configJson.stations[station].udpPort != undefined)
        {
            return this.configJson.stations[station].udpPort;
        }
        else
        {
            return 0;
        }
    }

    /**
     * Set the UDP port for a station.
     * @param stationSerial The serial for the station.
     * @param udpPort The UDP port.
     * @returns True on success otherwise false.
     */
    public setUdpLocalPortPerStation(stationSerial: string, udpPort : number) : boolean
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
    public getApiUsePushService() : boolean
    {
        if(this.configJson.apiConfig.apiUsePush != undefined)
        {
            return this.configJson.apiConfig.apiUsePush;
        }
        else
        {
            return false;
        }
    }

    /**
     * Set if push service is used.
     * @param usePushService The value if push service is used.
     */
    public setApiUsePushService(usePushService : boolean) : void
    {
        if(this.configJson.apiConfig.apiUsePush != usePushService)
        {
            this.configJson.apiConfig.apiUsePush = usePushService;
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
