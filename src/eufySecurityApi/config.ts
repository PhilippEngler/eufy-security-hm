import { readFileSync, writeFileSync } from 'fs';
import { parse, stringify } from 'ini';
import { CheckinResponse, FidInstallationResponse, GcmRegisterResponse } from './push/models';
import { Logger } from './utils/logging';

export class Config
{
    private filecontent !: string;
    private config : any;
    private hasChanged : boolean;
    private logger : Logger;
    
    /**
     * Constructor, read the config file and provide values to the variables.
     */
    constructor(logger : Logger)
    {
        this.logger = logger;
        this.loadConfig();
        this.hasChanged = false;
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
    public loadConfig() : void
    {
        try
        {
            this.hasChanged = false;
            this.filecontent = readFileSync('./config.ini', 'utf-8');
            this.filecontent = this.updateConfigFileTemplateStage1(this.filecontent);
            this.config = parse(this.filecontent);
            this.updateConfigFileTemplateStage2();
            this.writeConfig();
        }
        catch (ENOENT)
        {
            this.createNewEmptyConfigFile();
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
            this.hasChanged = true;
        }
        return filecontent;
    }

    /**
     * Check and add config entries to the config string after parsed.
     */
    private updateConfigFileTemplateStage2() : boolean
    {
        var updated = false;
        
        if(Number.parseInt(this.config['ConfigFileInfo']['config_file_version']) < 1)
        {
            this.logger.logInfoBasic("Configfile needs Stage2 update to version 1...");
            if(this.filecontent.indexOf("api_use_system_variables") == -1)
            {
                this.logger.logInfoBasic("  adding 'api_use_system_variables'.");
                this.filecontent = this.filecontent.replace("api_https_pkey_string=" + this.getApiKeyAsString(), "api_https_pkey_string=" + this.getApiKeyAsString() + "\r\napi_use_system_variables=false");
                this.config = parse(this.filecontent);
                updated = true;
                this.hasChanged = true;
            }
            if(this.filecontent.indexOf("api_camera_default_image") == -1)
            {
                this.logger.logInfoBasic("  adding 'api_camera_default_image'.");
                this.filecontent = this.filecontent.replace("api_use_system_variables=" + this.getApiUseSystemVariables(), "api_use_system_variables=" + this.getApiUseSystemVariables() + "\r\napi_camera_default_image=");
                this.config = parse(this.filecontent);
                updated = true;
                this.hasChanged = true;
            }
            if(this.filecontent.indexOf("api_camera_default_video") == -1)
            {
                this.logger.logInfoBasic("  adding 'api_camera_default_video'.");
                this.filecontent = this.filecontent.replace("api_camera_default_image=" + this.getApiCameraDefaultImage(), "api_camera_default_image=" + this.getApiCameraDefaultImage() + "\r\napi_camera_default_video=");
                this.config = parse(this.filecontent);
                updated = true;
                this.hasChanged = true;
            }
            updated = true;
            this.hasChanged = true;
            this.logger.logInfoBasic("...Stage2 update to version 1 finished.");
        }
        if(Number.parseInt(this.config['ConfigFileInfo']['config_file_version']) < 2)
        {
            this.logger.logInfoBasic("Configfile needs Stage2 update to version 2...");
            /*if(this.filecontent.indexOf("api_udp_local_static_ports") == -1)
            {
                this.logger.logInfoBasic(" adding 'api_udp_local_static_ports'.");
                this.filecontent = this.filecontent.replace("api_https_pkey_string=" + this.getApiKeyAsString(), "api_https_pkey_string=" + this.getApiKeyAsString() + "\r\napi_udp_local_static_ports=52789,52790");
                this.config = parse(this.filecontent);
                updated = true;
                this.hasChanged = true;
            }*/
            if(this.filecontent.indexOf("api_udp_local_static_ports_active") == -1)
            {
                this.logger.logInfoBasic("  adding 'api_udp_local_static_ports_active'.");
                this.filecontent = this.filecontent.replace("api_https_pkey_string=" + this.getApiKeyAsString(), "api_https_pkey_string=" + this.getApiKeyAsString() + "\r\api_udp_local_static_ports_active=false");
                this.config = parse(this.filecontent);
                updated = true;
                this.hasChanged = true;
            }
            updated = true;
            this.hasChanged = true;
            this.logger.logInfoBasic("...Stage2 update to version 2 finished.");
        }
        if(Number.parseInt(this.config['ConfigFileInfo']['config_file_version']) < 3)
        {
            this.logger.logInfoBasic("Configfile needs Stage2 update to version 3...");
            if(this.filecontent.indexOf("api_log_level") == -1)
            {
                this.logger.logInfoBasic(" adding 'api_log_level'.");
                this.filecontent = this.filecontent.replace("api_camera_default_video=" + this.getApiCameraDefaultVideo(), "api_camera_default_video=" + this.getApiCameraDefaultVideo() + "\r\napi_log_level=0");
                this.config = parse(this.filecontent);
                updated = true;
                this.hasChanged = true;
            }
            updated = true;
            this.hasChanged = true;
            this.logger.logInfoBasic("...Stage2 update to version 3 finished.");
        }
        if(Number.parseInt(this.config['ConfigFileInfo']['config_file_version']) < 4)
        {
            this.logger.logInfoBasic("Configfile needs Stage2 update to version 4...");
            if(this.filecontent.indexOf("api_connection_type") == -1)
            {
                this.logger.logInfoBasic(" adding 'api_connection_type'.");
                this.filecontent = this.filecontent.replace("api_udp_local_static_ports_active=", "api_connection_type=1\r\napi_udp_local_static_ports_active=");
                this.config = parse(this.filecontent);
                updated = true;
                this.hasChanged = true;
            }
            if(this.filecontent.indexOf("api_udp_local_static_ports=") > 0)
            {
                this.logger.logInfoBasic(" removing 'api_udp_local_static_ports'.");
                this.filecontent = this.filecontent.replace(/^.*api_udp_local_static_ports=.*$/mg, "");
                this.config = parse(this.filecontent);
                updated = true;
                this.hasChanged = true;
            }
            updated = true;
            this.hasChanged = true;
            this.logger.logInfoBasic("...Stage2 update to version 4 finished.");
        }
        if(Number.parseInt(this.config['ConfigFileInfo']['config_file_version']) < 5)
        {
            this.setTokenExpire("0");
            this.logger.logInfoBasic("Configfile needs Stage2 update to version 5...");
            if(this.filecontent.indexOf("api_update_state_active") == -1)
            {
                this.logger.logInfoBasic(" adding 'api_update_state_active'.");
                this.filecontent = this.filecontent.replace("api_log_level=", "api_update_state_active=false\r\napi_log_level=");
                this.config = parse(this.filecontent);
                updated = true;
                this.hasChanged = true;
            }
            if(this.filecontent.indexOf("api_update_state_timespan") == -1)
            {
                this.logger.logInfoBasic(" adding 'api_update_state_timespan'.");
                this.filecontent = this.filecontent.replace("api_log_level=", "api_update_state_timespan=15\r\napi_log_level=");
                this.config = parse(this.filecontent);
                updated = true;
                this.hasChanged = true;
            }
            if(this.filecontent.indexOf("api_update_links24_active") == -1)
            {
                this.logger.logInfoBasic(" adding 'api_update_links24_active'.");
                this.filecontent = this.filecontent.replace("api_log_level=", "api_update_links24_active=false\r\napi_log_level=");
                this.config = parse(this.filecontent);
                updated = true;
                this.hasChanged = true;
            }
            if(this.filecontent.indexOf("api_update_links_active") == -1)
            {
                this.logger.logInfoBasic(" adding 'api_update_links_active'.");
                this.filecontent = this.filecontent.replace("api_log_level=", "api_update_links_active=false\r\napi_log_level=");
                this.config = parse(this.filecontent);
                updated = true;
                this.hasChanged = true;
            }
            if(this.filecontent.indexOf("api_update_links_timespan") == -1)
            {
                this.logger.logInfoBasic(" adding 'api_update_links_timespan'.");
                this.filecontent = this.filecontent.replace("api_log_level=", "api_update_links_timespan=15\r\napi_log_level=");
                this.config = parse(this.filecontent);
                updated = true;
                this.hasChanged = true;
            }
            updated = true;
            this.hasChanged = true;
            this.logger.logInfoBasic("...Stage2 update to version 5 finished.");
        }
        if(Number.parseInt(this.config['ConfigFileInfo']['config_file_version']) < 6)
        {
            this.logger.logInfoBasic("Configfile needs Stage2 update to version 6...");
            if(this.filecontent.indexOf("api_udp_local_static_ports=") > 0)
            {
                this.logger.logInfoBasic(" removing 'api_udp_local_static_ports'.");
                this.filecontent = this.filecontent.replace(/^.*api_udp_local_static_ports=.*$/mg, "");
                this.config = parse(this.filecontent);
                updated = true;
                this.hasChanged = true;
            }
            if(this.filecontent.indexOf("api_update_links_only_when_active") == -1)
            {
                this.logger.logInfoBasic(" adding 'api_update_links_only_when_active'.");
                this.filecontent = this.filecontent.replace("api_log_level=", "api_update_links_only_when_active=false\r\napi_log_level=");
                this.config = parse(this.filecontent);
                updated = true;
                this.hasChanged = true;
            }
            updated = true;
            this.hasChanged = true;
            this.logger.logInfoBasic("...Stage2 update to version 6 finished.");
        }
        if(Number.parseInt(this.config['ConfigFileInfo']['config_file_version']) < 7)
        {
            this.logger.logInfoBasic("Configfile needs Stage2 update to version 7...");
            if(this.filecontent.indexOf("api_update_state_active") > 0)
            {
                this.logger.logInfoBasic(" rename 'api_update_state_active' to 'api_update_state_intervall_active'.");
                this.filecontent = this.filecontent.replace("api_update_state_active=", "api_update_state_intervall_active=");
                this.config = parse(this.filecontent);
                updated = true;
                this.hasChanged = true;
            }
            if(this.filecontent.indexOf("api_update_state_event_active") == -1)
            {
                this.logger.logInfoBasic(" adding 'api_update_state_event_active'.");
                this.filecontent = this.filecontent.replace("api_update_state_intervall_active=", "api_update_state_event_active=false\r\napi_update_state_intervall_active=");
                this.config = parse(this.filecontent);
                updated = true;
                this.hasChanged = true;
            }
            updated = true;
            this.hasChanged = true;
            this.logger.logInfoBasic("...Stage2 update to version 7 finished.");
        }
        if(Number.parseInt(this.config['ConfigFileInfo']['config_file_version']) < 8)
        {
            /*this.logger.logInfoBasic("Configfile needs Stage2 update to version 8...");
            if(this.filecontent.indexOf("location") == -1)
            {
                this.logger.logInfoBasic(" adding 'location'.");
                this.filecontent = this.filecontent.replace(`password=${this.getPassword()}`, `password=${this.getPassword()}\r\nlocation="1"`);
                this.config = parse(this.filecontent);
                updated = true;
                this.hasChanged = true;
            }
            updated = true;
            this.hasChanged = true;
            this.logger.logInfoBasic("...Stage2 update to version 8 finished.");*/
        }
        if(Number.parseInt(this.config['ConfigFileInfo']['config_file_version']) < 9)
        {
            this.logger.logInfoBasic("Configfile needs Stage2 update to version 9...");
            if(this.filecontent.indexOf("country") == -1)
            {
                this.logger.logInfoBasic(" adding 'country' and 'language'.");
                this.filecontent = this.filecontent.replace(`password=${this.getPassword()}`, `password=${this.getPassword()}\r\ncountry=DE\r\nlanguage=de\r\n\r\n`);
                this.config = parse(this.filecontent);
                updated = true;
                this.hasChanged = true;
            }
            if(this.filecontent.indexOf("[EufyAPIPushData]") == -1)
            {
                this.logger.logInfoBasic(" adding '[EufyAPIPushData]'.");
                this.filecontent = this.filecontent.replace(`language=${this.getLanguage()}`, `language=${this.getLanguage()}\r\n\r\n[EufyAPIPushData]\r\ntrusted_device_name=eufyclient\r\nserial_number=\r\nevent_duration_seconds=10\r\naccept_invitations=false\r\nopen_udid=\r\nfid_response_name=\r\nfid_response_fid=\r\nfid_response_refresh_token=\r\nfid_response_auth_token_token=\r\nfid_response_auth_token_expires_in=\r\nfid_response_auth_token_expires_at=\r\ncheckin_response_stats_ok=\r\ncheckin_response_time_ms=\r\ncheckin_response_android_id=\r\ncheckin_response_security_token=\r\ncheckin_response_version_info=\r\ncheckin_response_device_data_version_info=\r\ngcm_response_token=\r\npersistent_ids=\r\n\r\n`);
                this.config = parse(this.filecontent);
                updated = true;
                this.hasChanged = true;
            }
            updated = true;
            this.hasChanged = true;
            this.logger.logInfoBasic("...Stage2 update to version 9 finished.");
        }
        if(Number.parseInt(this.config['ConfigFileInfo']['config_file_version']) < 10)
        {
            this.logger.logInfoBasic("Configfile needs Stage2 update to version 10...");
            if(this.filecontent.indexOf("api_use_pushservice") == -1)
            {
                this.logger.logInfoBasic(" adding 'api_use_pushservice'.");
                this.filecontent = this.filecontent.replace(`api_log_level=${this.getApiLogLevel()}`, `api_use_pushservice=false\r\napi_log_level=${this.getApiLogLevel()}\r\n\r\n`);
                this.config = parse(this.filecontent);
                updated = true;
                this.hasChanged = true;
            }
            updated = true;
            this.hasChanged = true;
            this.logger.logInfoBasic("...Stage2 update to version 11 finished.");
        }
        if(Number.parseInt(this.config['ConfigFileInfo']['config_file_version']) == 10)
        {
            this.logger.logInfoBasic("Configfile needs country and language check...");
            if(this.getCountry() == "")
            {
                this.logger.logInfoBasic(" setting 'country' to standard value.");
                this.filecontent = this.filecontent.replace(`country=`, `country=DE`);
                this.config = parse(this.filecontent);
                updated = true;
                this.hasChanged = true;
            }
            if(this.getCountry() == "undefined")
            {
                this.logger.logInfoBasic(" setting 'country' to standard value.");
                this.filecontent = this.filecontent.replace(`country="undefined"`, `country=DE`);
                this.config = parse(this.filecontent);
                updated = true;
                this.hasChanged = true;
            }
            if(this.getLanguage() == "")
            {
                this.logger.logInfoBasic(" setting 'language' to standard value.");
                this.filecontent = this.filecontent.replace(`language=`, `language=de`);
                this.config = parse(this.filecontent);
                updated = true;
                this.hasChanged = true;
            }
            if(this.getLanguage() == "undefined")
            {
                this.logger.logInfoBasic(" setting 'language' to standard value.");
                this.filecontent = this.filecontent.replace(`language=undefined`, `language=de`);
                this.config = parse(this.filecontent);
                updated = true;
                this.hasChanged = true;
            }
            updated = true;
            this.hasChanged = true;
            this.logger.logInfoBasic("...country and language check finished.");
            this.logger.logInfoBasic("...Stage2 update to version 11 finished.");
        }

        if(updated)
        {
            this.config = parse(this.filecontent);
            this.config['ConfigFileInfo']['config_file_version'] = this.getConfigFileTemplateVersion();
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
                writeFileSync('./config.ini', stringify(this.config));
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
     * Crate a new, emty config file with the default values.
     */
    public createNewEmptyConfigFile() : boolean
    {
        var fc = "";

        fc += "[ConfigFileInfo]\r\nconfig_file_version=" + this.getConfigFileTemplateVersion() + "\r\n\r\n";
        fc += "[EufyAPILoginData]\r\n";
        fc += "email=\r\n";
        fc += "password=\r\n";
        fc += "country=DE\r\n";
        fc += "language=de\r\n\r\n";
        fc += "[EufyAPIPushData]\r\n";
        fc += "trusted_device_name=eufyclient\r\n";
        fc += "serial_number=\r\n";
        fc += "event_duration_seconds=10\r\n";
        fc += "accept_invitations=false\r\n";
        fc += "open_udid=\r\n";
        fc += "fid_response_name=\r\n";
        fc += "fid_response_fid=\r\n";
        fc += "fid_response_refresh_token=\r\n";
        fc += "fid_response_auth_token_token=\r\n";
        fc += "fid_response_auth_token_expires_in=\r\n";
        fc += "fid_response_auth_token_expires_at=\r\n";
        fc += "checkin_response_stats_ok=\r\n";
        fc += "checkin_response_time_ms=\r\n";
        fc += "checkin_response_android_id=\r\n";
        fc += "checkin_response_security_token=\r\n";
        fc += "checkin_response_version_info=\r\n";
        fc += "checkin_response_device_data_version_info=\r\n";
        fc += "gcm_response_token=\r\n";
        fc += "persistent_ids=\r\n\r\n";
        fc += "[EufyTokenData]\r\n";
        fc += "token=\r\n";
        fc += "tokenexpires=0\r\n\r\n";
        fc += "[EufyAPIServiceData]\r\n";
        fc += "api_http_active=true\r\n";
        fc += "api_http_port=52789\r\n";
        fc += "api_https_active=true\r\n";
        fc += "api_https_port=52790\r\n";
        fc += "api_https_method=\r\n";
        fc += "api_https_pkey_file=/usr/local/etc/config/server.pem\r\n";
        fc += "api_https_cert_file=/usr/local/etc/config/server.pem\r\n";
        fc += "api_https_pkey_string=\r\n";
        fc += "api_connection_type=1\r\n";
        fc += "api_udp_local_static_ports_active=false\r\n";
        fc += "api_use_system_variables=false\r\n";
        fc += "api_camera_default_image=\r\n";
        fc += "api_camera_default_video=\r\n";
        fc += "api_update_state_event_active=false\r\n";
        fc += "api_update_state_intervall_active=false\r\n";
        fc += "api_update_state_timespan=15\r\n";
        fc += "api_update_links24_active=false\r\n";
        fc += "api_update_links_active=true\r\n";
        fc += "api_update_links_timespan=15\r\n";
        fc += "api_use_pushservice=false\r\n";
        fc += "api_log_level=0\r\n\r\n"

        writeFileSync('./config.ini', fc);
        this.loadConfig();
        return true;
    }

    /**
     * Add section for a new station.
     * @param stationSerial Serialnumber of the new station.
     */
    public updateWithNewStation(stationSerial : string) : boolean
    {
        var res = this.writeConfig();
        if (res == "ok" || res == "saved")
        {
            this.logger.logInfoBasic(`Adding frame for station ${stationSerial}.`);
            var fc = readFileSync('./config.ini', 'utf-8');
            fc += "\r\n[EufyP2PData_" + stationSerial + "]\r\n";
            fc += "p2p_did=\r\n";
            fc += "dsk_key=\r\n";
            fc += "dsk_key_creation=\r\n";
            fc += "actor_id=\r\n";
            fc += "base_ip_address=\r\n";
            fc += "base_port=\r\n";
            fc += "udp_ports=\r\n";

            writeFileSync('./config.ini', fc);
            this.loadConfig();
            return true;
        }
        else
        {
            return false;
        }
    }

    /**
     * Checks if the station given by serialnumber is in the config.
     * @param stationSerial The serial of the station to check.
     */
    public isStationInConfig(stationSerial : string) : boolean
    {
        if(this.filecontent.indexOf("EufyP2PData_" + stationSerial) < 0)
        {
            return false;
        }
        else
        {
            return true;
        }
    }

    /**
     * Get the version of the configfile.
     * @returns The configfile version as string.
     */
    public getConfigFileVersion() : string
    {
        try
        {
            return this.config['ConfigFileInfo']['config_file_version'];
        }
        catch
        {
            return "";
        }
    }

    /**
     * Get the Username/Email-Address of the eufy security account.
     */
    public getEmailAddress() : string
    {
        try
        {
            return this.config['EufyAPILoginData']['email'];
        }
        catch
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
        if(this.config['EufyAPILoginData']['email'] != email)
        {
            this.config['EufyAPILoginData']['email'] = email;
            this.setToken("");
            this.hasChanged = true;
        }
    }

    /**
     * Get the password for the eufy security account.
     */
    public getPassword() : string
    {
        try
        {
            return this.config['EufyAPILoginData']['password'];
        }
        catch
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
        if(this.config['EufyAPILoginData']['password'] != password)
        {
            this.config['EufyAPILoginData']['password'] = password;
            this.hasChanged = true;
        }
    }

    /**
     * Returns true if the connection type for connecting with station.
     */
    public getConnectionType() : string
    {
        try
        {
            return this.config['EufyAPIServiceData']['api_connection_type'];
        }
        catch
        {
            return "-1";
        }
    }
 
    /**
     * Sets true, if static udp ports should be used otherwise false.
     * @param useUdpLocalStaticPorts Boolean value.
     */
    public setConnectionType(connectionType : string) : void
    {
        if(this.config['EufyAPIServiceData']['api_connection_type'] != connectionType)
        {
            this.config['EufyAPIServiceData']['api_connection_type'] = connectionType;
            this.hasChanged = true;
        }
    }

    /**
     * Returns true if the static udp ports should be used otherwise false.
     */
    public getUseUdpLocalPorts() : boolean
    {
        try
        {
            return this.config['EufyAPIServiceData']['api_udp_local_static_ports_active'];
        }
        catch
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
        if(this.config['EufyAPIServiceData']['api_udp_local_static_ports_active'] != useUdpLocalStaticPorts)
        {
            this.config['EufyAPIServiceData']['api_udp_local_static_ports_active'] = useUdpLocalStaticPorts;
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
                if(this.setUdpLocalPortPerStation(array[0], array[1]) == false)
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
        try
        {
            return this.config['EufyAPIServiceData']['api_use_system_variables'];
        }
        catch
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
        if(this.config['EufyAPIServiceData']['api_use_system_variables'] != apiusesystemvariables)
        {
            this.config['EufyAPIServiceData']['api_use_system_variables'] = apiusesystemvariables;
            this.hasChanged = true;
        }
    }

    /**
     * Get weather http should be used for api.
     */
    public getApiUseHttp() : boolean
    {
        try
        {
            return this.config['EufyAPIServiceData']['api_http_active'];
        }
        catch
        {
            return false;
        }
    }

    /**
     * Set weather http sould be used for api.
     * @param apiport Use http for the api.
     */
    public setApiUseHttp(apiusehttp : boolean) : void
    {
        if(this.config['EufyAPIServiceData']['api_http_active'] != apiusehttp)
        {
            this.config['EufyAPIServiceData']['api_http_active'] = apiusehttp;
            this.hasChanged = true;
        }
    }

    /**
     * Get the port for the webserver (HTTP) for the api.
     */
    public getApiPortHttp() : string
    {
        try
        {
            return this.config['EufyAPIServiceData']['api_http_port'];
        }
        catch
        {
            return "";
        }
    }

    /**
     * Set the port for the webserver (HTTP) for the api.
     * @param apiport The port the api should be accessable.
     */
    public setApiPortHttp(apiport : string) : void
    {
        if(this.config['EufyAPIServiceData']['api_http_port'] != apiport)
        {
            this.config['EufyAPIServiceData']['api_http_port'] = apiport;
            this.hasChanged = true;
        }
    }

    /**
     * Get weather https should be used for api.
     */
    public getApiUseHttps() : boolean
    {
        try
        {
            return this.config['EufyAPIServiceData']['api_https_active'];
        }
        catch
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
        if(this.config['EufyAPIServiceData']['api_https_active'] != apiusehttps)
        {
            this.config['EufyAPIServiceData']['api_https_active'] = apiusehttps;
            this.hasChanged = true;
        }
    }

    /**
     * Get the port for the webserver (HTTPS) for the api.
     */
    public getApiPortHttps() : string
    {
        try
        {
            return this.config['EufyAPIServiceData']['api_https_port'];
        }
        catch
        {
            return "";
        }
    }

    /**
     * Set the port for the webserver (HTTPS) for the api.
     * @param apiport The port the api should be accessable.
     */
    public setApiPortHttps(apiport : string) : void
    {
        if(this.config['EufyAPIServiceData']['api_https_port'] != apiport)
        {
            this.config['EufyAPIServiceData']['api_https_port'] = apiport;
            this.hasChanged = true;
        }
    }

    /**
     * Returns the method used for https.
     */
    public getApiMethodHttps() : string
    {
        try
        {
            return this.config['EufyAPIServiceData']['api_https_method'];
        }
        catch
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
        if(this.config['EufyAPIServiceData']['api_https_method'] != apimethod)
        {
            this.config['EufyAPIServiceData']['api_https_method'] = apimethod;
            this.hasChanged = true;
        }
    }

    /**
     * Get the key for https.
     */
    public getApiKeyFileHttps() : string
    {
        try
        {
            return this.config['EufyAPIServiceData']['api_https_pkey_file'];
        }
        catch
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
        if(this.config['EufyAPIServiceData']['api_https_pkey_file'] != apipkey)
        {
            this.config['EufyAPIServiceData']['api_https_pkey_file'] = apipkey;
            this.hasChanged = true;
        }
    }

    /**
     * Returns the cert file for https.
     */
    public getApiCertFileHttps() : string
    {
        try
        {
            return this.config['EufyAPIServiceData']['api_https_cert_file'];
        }
        catch
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
        if(this.config['EufyAPIServiceData']['api_https_cert_file'] != apicert)
        {
            this.config['EufyAPIServiceData']['api_https_cert_file'] = apicert;
            this.hasChanged = true;
        }
    }

    /**
     * Get the key as string for https.
     */
    public getApiKeyAsString() : string
    {
        try
        {
            return this.config['EufyAPIServiceData']['api_https_pkey_string'];
        }
        catch
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
        if(this.config['EufyAPIServiceData']['api_https_pkey_string'] != apikeyasstring)
        {
            this.config['EufyAPIServiceData']['api_https_pkey_string'] = apikeyasstring;
            this.hasChanged = true;
        }
    }

    /**
     * Get the default image for cameras.
     */
    public getApiCameraDefaultImage() : string
    {
        try
        {
            return this.config['EufyAPIServiceData']['api_camera_default_image'];
        }
        catch
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
        if(this.config['EufyAPIServiceData']['api_camera_default_image'] != apicameradefaultimage)
        {
            this.config['EufyAPIServiceData']['api_camera_default_image'] = apicameradefaultimage;
            this.hasChanged = true;
        }
    }

    /**
     * Get the default video for cameras.
     */
    public getApiCameraDefaultVideo() : string
    {
        try
        {
            return this.config['EufyAPIServiceData']['api_camera_default_video'];
        }
        catch
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
        if(this.config['EufyAPIServiceData']['api_camera_default_video'] != apicameradefaultvideo)
        {
            this.config['EufyAPIServiceData']['api_camera_default_video'] = apicameradefaultvideo;
            this.hasChanged = true;
        }
    }

    /**
     * Determines if the updated state runs by event.
     */
    public getApiUseUpdateStateEvent() : boolean
    {
        try
        {
            return this.config['EufyAPIServiceData']['api_update_state_event_active'];
        }
        catch
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
        if(this.config['EufyAPIServiceData']['api_update_state_event_active'] != apiuseupdatestateevent)
        {
            this.config['EufyAPIServiceData']['api_update_state_event_active'] = apiuseupdatestateevent;
            this.hasChanged = true;
        }
    }

    /**
     * Determines if the updated state runs scheduled.
     */
    public getApiUseUpdateStateIntervall() : boolean
    {
        try
        {
            return this.config['EufyAPIServiceData']['api_update_state_intervall_active'];
        }
        catch
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
        if(this.config['EufyAPIServiceData']['api_update_state_intervall_active'] != apiuseupdatestateintervall)
        {
            this.config['EufyAPIServiceData']['api_update_state_intervall_active'] = apiuseupdatestateintervall;
            this.hasChanged = true;
        }
    }

    /**
     * Returns the time between runs of two scheduled tasks for update state.
     */
    public getApiUpdateStateTimespan() : string
    {
        try
        {
            return this.config['EufyAPIServiceData']['api_update_state_timespan'];
        }
        catch
        {
            return "";
        }
    }

    /**
     * Set the value for the time between runs of two scheduled tasks for update state. 
     * @param apiupdatestatetimespan The time in minutes.
     */
    public setApiUpdateStateTimespan(apiupdatestatetimespan : string) : void
    {
        if(this.config['EufyAPIServiceData']['api_update_state_timespan'] != apiupdatestatetimespan)
        {
            this.config['EufyAPIServiceData']['api_update_state_timespan'] = apiupdatestatetimespan;
            this.hasChanged = true;
        }
    }

    /**
     * Determines if the updated links runs scheduled.
     */
    public getApiUseUpdateLinks() : boolean
    {
        try
        {
            return this.config['EufyAPIServiceData']['api_update_links_active'];
        }
        catch
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
        if(this.config['EufyAPIServiceData']['api_update_links_active'] != apiuseupdatelinks)
        {
            this.config['EufyAPIServiceData']['api_update_links_active'] = apiuseupdatelinks;
            this.hasChanged = true;
        }
    }

    /**
     * Returns the time between runs of two scheduled tasks for update state.
     */
    public getApiUpdateLinksTimespan() : string
    {
        try
        {
            return this.config['EufyAPIServiceData']['api_update_links_timespan'];
        }
        catch
        {
            return "";
        }
    }

    /**
     * Set the value for the time between runs of two scheduled tasks for update links.
     * @param apiupdatestatetimespan The time in minutes.
     */
    public setApiUpdateLinksTimespan(apiupdatelinkstimespan : string) : void
    {
        if(this.config['EufyAPIServiceData']['api_update_links_timespan'] != apiupdatelinkstimespan)
        {
            this.config['EufyAPIServiceData']['api_update_links_timespan'] = apiupdatelinkstimespan;
            this.hasChanged = true;
        }
    }

    /**
     * Return weather the api should only refresh links when eufy state is other than off or deactivated.
     */
    public getApiUpdateLinksOnlyWhenActive() : boolean
    {
        try
        {
            return this.config['EufyAPIServiceData']['api_update_links_only_when_active'];
        }
        catch
        {
            return false;
        }
    }

    /**
     * Set the value the api should only refresh links when eufy state is other than off or deactivated
     * @param apiupdatelinksonlywhenactive true for not refreshing links during off or deactivated, otherwise false.
     */
    public setApiUpdateLinksOnlyWhenActive(apiupdatelinksonlywhenactive : boolean)
    {
        if(this.config['EufyAPIServiceData']['api_update_links_only_when_active'] != apiupdatelinksonlywhenactive)
        {
            this.config['EufyAPIServiceData']['api_update_links_only_when_active'] = apiupdatelinksonlywhenactive;
            this.hasChanged = true;
        }
    }

    /**
     * Returns the log level.
     */
    public getApiLogLevel() : number
    {
        try
        {
            return this.config['EufyAPIServiceData']['api_log_level'];
        }
        catch
        {
            return 0;
        }
    }

    /**
     * Set the log level.
     * @param apiloglevel The log level as number to set
     */
    public setApiLogLevel(apiloglevel : string) : void
    {
        if(this.config['EufyAPIServiceData']['api_log_level'] != apiloglevel)
        {
            this.config['EufyAPIServiceData']['api_log_level'] = apiloglevel;
            this.hasChanged = true;
        }
    }

    /**
     * Get the token for login to the eufy security account.
     */
    public getToken() : string
    {
        try
        {
            return this.config['EufyTokenData']['token'];
        }
        catch
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
        if(this.config['EufyTokenData']['token'] != token)
        {
            this.config['EufyTokenData']['token'] = token;
            this.hasChanged = true;
        }
    }

    /**
     * Get the timestamp the token expires.
     */
    public getTokenExpire() : string
    {
        try
        {
            return this.config['EufyTokenData']['tokenexpires'];
        }
        catch
        {
            return "";
        }
    }

    /**
     * Set the timestamp the token expires.
     * @param tokenexpire The time the token expires.
     */
    public setTokenExpire(tokenexpire : string) : void
    {
        if(this.config['EufyTokenData']['tokenexpires'] != tokenexpire)
        {
            this.config['EufyTokenData']['tokenexpires'] = tokenexpire;
            this.hasChanged = true;
        }
    }

    /**
     * Get the P2P_DID for the given station.
     * @param stationSerial The serialnumber of the station.
     */
    public getP2PData_p2p_did(stationSerial : string) : string
    {
        try
        {
            return this.config['EufyP2PData_' + stationSerial]['p2p_did'];
        }
        catch
        {
            return "";
        }
    }

    /**
     * Set the P2P_DID for the given station.
     * @param stationSerial The serialnumber of the station.
     * @param p2p_did The P2P_DID to set.
     */
    private setP2PData_p2p_did(stationSerial : string, p2p_did : string) : void
    {
        if(this.config['EufyP2PData_' + stationSerial]['p2p_did'] != p2p_did)
        {
            this.config['EufyP2PData_' + stationSerial]['p2p_did'] = p2p_did;
            this.hasChanged = true;
        }
    }

    /**
     * Get the DSK_KEY for the given station.
     * @param stationSerial The serialnumber of the station.
     */
    public getP2PData_dsk_key(stationSerial: string) : string
    {
        try
        {
            return this.config['EufyP2PData_' + stationSerial]['dsk_key'];
        }
        catch
        {
            return "";
        }
    }

    /**
     * Set the DSK_KEY for the given station.
     * @param stationSerial The serialnumber of the station.
     * @param dsk_key The DSK_KEY to set.
     */
    private setP2PData_dsk_key(stationSerial: string, dsk_key : string) : void
    {
        if(this.config['EufyP2PData_' + stationSerial]['dsk_key'] != dsk_key)
        {
            this.config['EufyP2PData_' + stationSerial]['dsk_key'] = dsk_key;
            this.hasChanged = true;
        }
    }

    /**
     * Get the timestamp the DSK_KEY is to expire.
     * @param stationSerial The serialnumber of the station.
     */
    public getP2PData_dsk_key_creation(stationSerial: string) : string
    {
        try
        {
            return this.config['EufyP2PData_' + stationSerial]['dsk_key_creation'];
        }
        catch
        {
            return "";
        }
    }

    /**
     * Set the timestamp the DSK_KEY is to expire.
     * @param stationSerial The serialnumber of the station.
     * @param dsk_key_creation The timestamp of the expire.
     */
    private setP2PData_dsk_key_creation(stationSerial: string, dsk_key_creation : string) : void
    {
        if(this.config['EufyP2PData_' + stationSerial]['dsk_key_creation'] != dsk_key_creation)
        {
            this.config['EufyP2PData_' + stationSerial]['dsk_key_creation'] = dsk_key_creation;
            this.hasChanged = true;
        }
    }

    /**
     * Get the actor id of the given station.
     * @param stationSerial The serialnumber of the station.
     */
    public getP2PData_actor_id(stationSerial: string) : string
    {
        try
        {
            return this.config['EufyP2PData_' + stationSerial]['actor_id'];
        }
        catch
        {
            return "";
        }
    }

    /**
     * Set the actor id of the given station.
     * @param stationSerial The serialnumber of the station.
     * @param actor_id The actor id to set.
     */
    private setP2PData_actor_id(stationSerial: string, actor_id : string) : void
    {
        if(this.config['EufyP2PData_' + stationSerial]['actor_id'] != actor_id)
        {
            this.config['EufyP2PData_' + stationSerial]['actor_id'] = actor_id;
            this.hasChanged = true;
        }
    }

    /**
     * Get the local ip address of the station.
     * @param stationSerial The serialnumber of the station.
     */
    public getP2PData_station_ip_address(stationSerial: string) : string
    {
        try
        {
            return this.config['EufyP2PData_' + stationSerial]['base_ip_address'];
        }
        catch
        {
            return "";
        }
    }

    /**
     * Set the local ip address of the given station.
     * @param stationSerial The serialnumber of the station.
     * @param station_ip_address The local ip address.
     */
    private setP2PData_station_ip_address(stationSerial: string, station_ip_address : string) : void
    {
        if(this.config['EufyP2PData_' + stationSerial]['base_ip_address'] != station_ip_address)
        {
            this.config['EufyP2PData_' + stationSerial]['base_ip_address'] = station_ip_address;
            this.hasChanged = true;
        }
    }

    /**
     * Get the last used port for P2P connunication with the given station.
     * @param stationSerial The serialnumber of the station.
     */
    public getP2PData_station_port(stationSerial: string) : string
    {
        try
        {
            return this.config['EufyP2PData_' + stationSerial]['base_port'];
        }
        catch
        {
            return "";
        }
    }

    /**
     * Set the port used for 2P communication with the given station.
     * @param stationSerial The serialnumber of the station.
     * @param station_port The port to set.
     */
    private setP2PData_station_port(stationSerial: string, station_port : string) : void
    {
        if(this.config['EufyP2PData_' + stationSerial]['base_port'] != station_port)
        {
            this.config['EufyP2PData_' + stationSerial]['base_port'] = station_port;
            this.hasChanged = true;
        }
    }

    /**
     * Returns the UDP port for the station.
     * @param stationSerial The serial of the station.
     * @returns The UDP port for the station.
     */
    public getUdpLocalPortsPerStation(stationSerial : string) : string
    {
        try
        {
            return this.config['EufyP2PData_' + stationSerial]['udp_ports'];
        }
        catch
        {
            return "";
        }
    }

    /**
     * Set the UDP port for a station.
     * @param stationSerial The serial for the station.
     * @param udp_ports The UDP port.
     * @returns True on success otherwise false.
     */
    public setUdpLocalPortPerStation(stationSerial: string, udp_ports : string) : boolean
    {
        var res;
        if(this.isStationInConfig(stationSerial) == false)
        {
            this.logger.logInfo(1, `Station ${stationSerial} not in config.`)
            res = this.updateWithNewStation(stationSerial);
        }
        else
        {
            res = true;
        }
        if(res)
        {
            if(stationSerial != undefined && udp_ports != undefined)
            {
                if(this.config['EufyP2PData_' + stationSerial]['udp_ports'] != udp_ports)
                {
                    this.config['EufyP2PData_' + stationSerial]['udp_ports'] = udp_ports;
                    this.hasChanged = true;
                    res = true;
                }
            }
            res = false;
        }
        return res;
    }

    /**
     * Saves the P2P releated data for a given station. If the station is currently not in config, it will be created before the config data is populated.
     * The config data will be saved and the config is reloaded.
     * 
     * @param stationSerial The serialnumber of the station
     * @param p2p_did The P2P_DID for the P2P connection
     * @param dsk_key The DSK_KEY for the P2P connection
     * @param dsk_key_creation The timestamp the DSK_KEY will be unusable
     * @param actor_id The actor id for P2P communication
     * @param station_ip_address The local ip address of the station
     * @param station_port The port the P2P communication with the station is done
     */
    public setP2PData(stationSerial : string, p2p_did : string,  dsk_key : string,  dsk_key_creation : string, actor_id : string, station_ip_address : string, station_port : string) : void
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
            this.setP2PData_p2p_did(stationSerial, p2p_did);
            this.setP2PData_dsk_key(stationSerial, dsk_key);
            this.setP2PData_dsk_key_creation(stationSerial, dsk_key_creation);
            this.setP2PData_actor_id(stationSerial, actor_id);
            this.setP2PData_station_ip_address(stationSerial, station_ip_address);
            this.setP2PData_station_port(stationSerial, station_port);

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
        try
        {
            return this.config['EufyAPIServiceData']['api_use_pushservice'];
        }
        catch
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
        if(this.config['EufyAPIServiceData']['api_use_pushservice'] != usePushService)
        {
            this.config['EufyAPIServiceData']['api_use_pushservice'] = usePushService;
            this.hasChanged = true;
        }
    }

    /**
     * Get the trusted device name for push connection.
     * @returns The trusted device name.
     */
    public getTrustedDeviceName() : string
    {
        try
        {
            return this.config['EufyAPIPushData']['trusted_device_name'];
        }
        catch
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
        if(this.config['EufyAPIPushData']['trusted_device_name'] != trustedDeviceName)
        {
            this.config['EufyAPIPushData']['trusted_device_name'] = trustedDeviceName;
            this.hasChanged = true;
        }
    }

    /**
     * Get the string of seconds as string how long the event shoud remain in state true.
     * @returns A String value contaiong the seconds
     */
    public getEventDurationSeconds() : string
    {
        try
        {
            return this.config['EufyAPIPushData']['event_duration_seconds'];
        }
        catch
        {
            return "";
        }
    }

    /**
     * Get the number of seconds as string how long the event shoud remain in state true.
     * @returns A number value contaiong the seconds
     */
    public getEventDurationSecondsAsNumber() : number
    {
        try
        {
            return this.config['EufyAPIPushData']['event_duration_seconds'] as number;
        }
        catch
        {
            return -1;
        }
    }

    /**
     * Set the number of seconds as string how long the event shoud remain in state true.
     * @param eventDurationSeconds A String value contaiong the seconds
     */
    public setEventDurationSeconds(eventDurationSeconds : string) : void
    {
        if(this.config['EufyAPIPushData']['event_duration_seconds'] != eventDurationSeconds)
        {
            this.config['EufyAPIPushData']['event_duration_seconds'] = eventDurationSeconds;
            this.hasChanged = true;
        }
    }

    /**
     * Get the boolean value if invitations should be accepted.
     * @returns A boolean value
     */
    public getAcceptInvitations() : boolean
    {
        try
        {
            return this.config['EufyAPIPushData']['accept_invitations'];
        }
        catch
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
        if(this.config['EufyAPIPushData']['accept_invitations'] != acceptInvitations)
        {
            this.config['EufyAPIPushData']['accept_invitations'] = acceptInvitations;
            this.hasChanged = true;
        }
    }

    /**
     * Get the openudid for push connections.
     * @returns The openudid
     */
    public getOpenudid() : string
    {
        try
        {
            return this.config['EufyAPIPushData']['open_udid'];
        }
        catch
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
        if(this.config['EufyAPIPushData']['open_udid'] != openudid)
        {
            this.config['EufyAPIPushData']['open_udid'] = openudid;
            this.hasChanged = true;
        }
    }

    /**
     * Get the serial number for push connections.
     * @returns The serial number
     */
    public getSerialNumber() : string
    {
        try
        {
            return this.config['EufyAPIPushData']['serial_number'];
        }
        catch
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
        if(this.config['EufyAPIPushData']['serial_number'] != serialNumber)
        {
            this.config['EufyAPIPushData']['serial_number'] = serialNumber;
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
        try
        {
            var res: FidInstallationResponse = {name: this.config['EufyAPIPushData']['fid_response_name'], fid: this.config['EufyAPIPushData']['fid_response_fid'], refreshToken: this.config['EufyAPIPushData']['fid_response_refresh_Token'], authToken: { token: this.config['EufyAPIPushData']['fid_response_auth_token_token'], expiresIn: this.config['EufyAPIPushData']['fid_response_auth_token_expires_in'], expiresAt: this.config['EufyAPIPushData']['fid_response_auth_token_expires_at'] }}
            return res;
        }
        catch
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
        if(this.config['EufyAPIPushData']['fid_response_name'] != fidResponse.name || this.config['EufyAPIPushData']['fid_response_fid'] != fidResponse.fid || this.config['EufyAPIPushData']['fid_response_refresh_Token'] != fidResponse.refreshToken || this.config['EufyAPIPushData']['fid_response_auth_token_token'] != fidResponse.authToken.token || this.config['EufyAPIPushData']['fid_response_auth_token_expires_in'] != fidResponse.authToken.expiresIn || this.config['EufyAPIPushData']['fid_response_auth_token_expires_at'] != fidResponse.authToken.expiresAt)
        {
            this.config['EufyAPIPushData']['fid_response_name'] = fidResponse.name;
            this.config['EufyAPIPushData']['fid_response_fid'] = fidResponse.fid;
            this.config['EufyAPIPushData']['fid_response_refresh_Token'] = fidResponse.refreshToken;
            this.config['EufyAPIPushData']['fid_response_auth_token_token'] = fidResponse.authToken.token;
            this.config['EufyAPIPushData']['fid_response_auth_token_expires_in'] = fidResponse.authToken.expiresIn;
            this.config['EufyAPIPushData']['fid_response_auth_token_expires_at'] = fidResponse.authToken.expiresAt;
            this.hasChanged = true;
        }
    }

    /**
     * Get the checkin response credentials for push connections.
     * @returns The checkin response credentials
     */
    public getCredentialsCheckinResponse() : CheckinResponse | null
    {
        try
        {
            var res: CheckinResponse = {statsOk: this.config['EufyAPIPushData']['checkin_response_stats_ok'], timeMs: this.config['EufyAPIPushData']['checkin_response_time_ms'], androidId: this.config['EufyAPIPushData']['checkin_response_android_id'], securityToken: this.config['EufyAPIPushData']['checkin_response_security_token'], versionInfo: this.config['EufyAPIPushData']['checkin_response_version_info'], deviceDataVersionInfo: this.config['EufyAPIPushData']['checkin_response_device_data_version_info']}
            return res;
        }
        catch
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
        if(this.config['EufyAPIPushData']['checkin_response_stats_ok'] != checkinResponse.statsOk || this.config['EufyAPIPushData']['checkin_response_time_ms'] != checkinResponse.timeMs || this.config['EufyAPIPushData']['checkin_response_android_id'] != checkinResponse.androidId || this.config['EufyAPIPushData']['checkin_response_security_token'] != checkinResponse.securityToken || this.config['EufyAPIPushData']['checkin_response_version_info'] != checkinResponse.versionInfo || this.config['EufyAPIPushData']['checkin_response_device_data_version_info'] != checkinResponse.deviceDataVersionInfo)
        {
            this.config['EufyAPIPushData']['checkin_response_stats_ok'] = checkinResponse.statsOk;
            this.config['EufyAPIPushData']['checkin_response_time_ms'] = checkinResponse.timeMs;
            this.config['EufyAPIPushData']['checkin_response_android_id'] = checkinResponse.androidId;
            this.config['EufyAPIPushData']['checkin_response_security_token'] = checkinResponse.securityToken;
            this.config['EufyAPIPushData']['checkin_response_version_info'] = checkinResponse.versionInfo;
            this.config['EufyAPIPushData']['checkin_response_device_data_version_info'] = checkinResponse.deviceDataVersionInfo;
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
            var res: GcmRegisterResponse = {token: this.config['EufyAPIPushData']['gcm_response_token']}
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
        if(this.config['EufyAPIPushData']['gcm_response_token'] != gcmResponse.token)
        {
            this.config['EufyAPIPushData']['gcm_response_token'] = gcmResponse.token;
            this.hasChanged = true;
        }
    }

    /**
     * Get the persistent id credentials for push connections.
     * @returns The persistent id credentials
     */
    public getCredentialsPersistentIds() : string[]
    {
        try
        {
            return this.config['EufyAPIPushData']['persistent_ids'];
        }
        catch
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
        if(this.config['EufyAPIPushData']['persistent_ids'] != persistentIds)
        {
            this.config['EufyAPIPushData']['persistent_ids'] = persistentIds;
            this.hasChanged = true;
        }
    }

    /**
     * Get the country code.
     * @returns The country code
     */
    public getCountry() : string
    {
        try
        {
            return this.config['EufyAPILoginData']['country'];
        }
        catch
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
        if(this.config['EufyAPILoginData']['country'] != country)
        {
            this.config['EufyAPILoginData']['country'] = country;
            this.hasChanged = true;
        }
    }

    /**
     * Get the language code.
     * @returns The language code
     */
    public getLanguage() : string
    {
        try
        {
            return this.config['EufyAPILoginData']['language'];
        }
        catch
        {
            return "en";
        }
    }

    /**
     * Set the language code.
     * @param language The language code
     */
    public setLanguage(language : string) : void
    {
        if(this.config['EufyAPILoginData']['language'] != language)
        {
            this.config['EufyAPILoginData']['language'] = language;
            this.hasChanged = true;
        }
    }
}
