import { readFileSync, writeFileSync } from 'fs';
import { parse, stringify } from 'ini';
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

    private getConfigFileTemplateVersion() : number
    {
        return 1;
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
            this.logger.log("Logfile needs Stage1 update. Adding 'config_file_version'.");
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

        if(this.filecontent.indexOf("api_use_system_variables") == -1)
        {
            this.logger.log("Logfile needs Stage2 update. Adding 'api_use_system_variables'.");
            this.filecontent = this.filecontent.replace("api_https_pkey_string=" + this.getApiKeyAsString(), "api_https_pkey_string=" + this.getApiKeyAsString() + "\r\napi_use_system_variables=false");
            this.config = parse(this.filecontent);
            updated = true;
            this.hasChanged = true;
        }
        if(this.filecontent.indexOf("api_camera_default_image") == -1)
        {
            this.logger.log("Logfile needs Stage2 update. Adding 'api_camera_default_image'.");
            this.filecontent = this.filecontent.replace("api_use_system_variables=" + this.getApiUseSystemVariables(), "api_use_system_variables=" + this.getApiUseSystemVariables() + "\r\napi_camera_default_image=");
            this.config = parse(this.filecontent);
            updated = true;
            this.hasChanged = true;
        }
        if(this.filecontent.indexOf("api_camera_default_video") == -1)
        {
            this.logger.log("Logfile needs Stage2 update. Adding 'api_camera_default_video'.");
            this.filecontent = this.filecontent.replace("api_camera_default_image=" + this.getApiCameraDefaultImage(), "api_camera_default_image=" + this.getApiCameraDefaultImage() + "\r\napi_camera_default_video=");
            this.config = parse(this.filecontent);
            updated = true;
            this.hasChanged = true;
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
        fc += "password=\r\n\r\n";
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
        fc += "api_use_system_variables=false\r\n";
        fc += "api_camera_default_image=\r\n";
        fc += "api_camera_default_video=\r\n";

        writeFileSync('./config.ini', fc);
        this.loadConfig();
        return true;
    }

    /**
     * Add section for a new Base.
     * @param baseSerial Serialnumber of the new Base.
     */
    public updateWithNewBase(baseSerial : string) : boolean
    {
        this.writeConfig();
        var fc = readFileSync('./config.ini', 'utf-8');
        fc += "\r\n[EufyP2PData_" + baseSerial + "]\r\n";
        fc += "p2p_did=\r\n";
        fc += "dsk_key=\r\n";
        fc += "dsk_key_creation=\r\n";
        fc += "actor_id=\r\n";
        fc += "base_ip_address=\r\n";
        fc += "base_port=\r\n";

        writeFileSync('./config.ini', fc);
        this.loadConfig();
        return true;
    }

    /**
     * Checks if the Base given by serialnumber is in the config.
     * @param baseSerial The serial of the Base to check.
     */
    public isBaseInConfig(baseSerial : string) : boolean
    {
        if(this.filecontent.indexOf("EufyP2PData_" + baseSerial) < 0)
        {
            return false;
        }
        else
        {
            return true;
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
     * @param apiport Use https for the api..
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
     * Get the P2P_DID for the given Base.
     * @param baseSerial The serialnumber of the Base.
     */
    public getP2PData_p2p_did(baseSerial : string) : string
    {
        try
        {
            return this.config['EufyP2PData_' + baseSerial]['p2p_did'];
        }
        catch
        {
            return "";
        }
    }

    /**
     * Set the P2P_DID for the given Base.
     * @param baseSerial The serialnumber of the Base.
     * @param p2p_did The P2P_DID to set.
     */
    private setP2PData_p2p_did(baseSerial : string, p2p_did : string) : void
    {
        if(this.config['EufyP2PData_' + baseSerial]['p2p_did'] != p2p_did)
        {
            this.config['EufyP2PData_' + baseSerial]['p2p_did'] = p2p_did;
            this.hasChanged = true;
        }
    }

    /**
     * Get the DSK_KEY for the given base.
     * @param baseSerial The serialnumber of the Base.
     */
    public getP2PData_dsk_key(baseSerial: string) : string
    {
        try
        {
            return this.config['EufyP2PData_' + baseSerial]['dsk_key'];
        }
        catch
        {
            return "";
        }
    }

    /**
     * Set the DSK_KEY for the given Base.
     * @param baseSerial The serialnumber of the Base.
     * @param dsk_key The DSK_KEY to set.
     */
    private setP2PData_dsk_key(baseSerial: string, dsk_key : string) : void
    {
        if(this.config['EufyP2PData_' + baseSerial]['dsk_key'] != dsk_key)
        {
            this.config['EufyP2PData_' + baseSerial]['dsk_key'] = dsk_key;
            this.hasChanged = true;
        }
    }

    /**
     * Get the timestamp the DSK_KEY is to expire.
     * @param baseSerial The serialnumber of the Base.
     */
    public getP2PData_dsk_key_creation(baseSerial: string) : string
    {
        try
        {
            return this.config['EufyP2PData_' + baseSerial]['dsk_key_creation'];
        }
        catch
        {
            return "";
        }
    }

    /**
     * Set the timestamp the DSK_KEY is to expire.
     * @param baseSerial The serialnumber of the Base.
     * @param dsk_key_creation The timestamp of the expire.
     */
    private setP2PData_dsk_key_creation(baseSerial: string, dsk_key_creation : string) : void
    {
        if(this.config['EufyP2PData_' + baseSerial]['dsk_key_creation'] != dsk_key_creation)
        {
            this.config['EufyP2PData_' + baseSerial]['dsk_key_creation'] = dsk_key_creation;
            this.hasChanged = true;
        }
    }

    /**
     * Get the actor id of the given Base.
     * @param baseSerial The serialnumber of the Base.
     */
    public getP2PData_actor_id(baseSerial: string) : string
    {
        try
        {
            return this.config['EufyP2PData_' + baseSerial]['actor_id'];
        }
        catch
        {
            return "";
        }
    }

    /**
     * Set the actor id of the given Base.
     * @param baseSerial The serialnumber of the Base.
     * @param actor_id The actor id to set.
     */
    private setP2PData_actor_id(baseSerial: string, actor_id : string) : void
    {
        if(this.config['EufyP2PData_' + baseSerial]['actor_id'] != actor_id)
        {
            this.config['EufyP2PData_' + baseSerial]['actor_id'] = actor_id;
            this.hasChanged = true;
        }
    }

    /**
     * Get the local ip address of the Base.
     * @param baseSerial The serialnumber of the Base.
     */
    public getP2PData_base_ip_address(baseSerial: string) : string
    {
        try
        {
            return this.config['EufyP2PData_' + baseSerial]['base_ip_address'];
        }
        catch
        {
            return "";
        }
    }

    /**
     * Set the local ip address of the given Base.
     * @param baseSerial The serialnumber of the Base.
     * @param base_ip_address The local ip address.
     */
    private setP2PData_base_ip_address(baseSerial: string, base_ip_address : string) : void
    {
        if(this.config['EufyP2PData_' + baseSerial]['base_ip_address'] != base_ip_address)
        {
            this.config['EufyP2PData_' + baseSerial]['base_ip_address'] = base_ip_address;
            this.hasChanged = true;
        }
    }

    /**
     * Get the last used port for P2P connunication with the given Base.
     * @param baseSerial The serialnumber of the Base.
     */
    public getP2PData_base_port(baseSerial: string) : string
    {
        try
        {
            return this.config['EufyP2PData_' + baseSerial]['base_port'];
        }
        catch
        {
            return "";
        }
    }

    /**
     * Set the port used for 2P communication with the given Base.
     * @param baseSerial The serialnumber of the Base.
     * @param base_port The port to set.
     */
    private setP2PData_base_port(baseSerial: string, base_port : string) : void
    {
        if(this.config['EufyP2PData_' + baseSerial]['base_port'] != base_port)
        {
            this.config['EufyP2PData_' + baseSerial]['base_port'] = base_port;
            this.hasChanged = true;
        }
    }

    /**
     * Saves the P2P releated data for a given base. If the base is currently not in config, it will be created before the config data is populated.
     * The config data will be saved and the config is reloaded.
     * 
     * @param baseSerial The serialnumber of the base
     * @param p2p_did The P2P_DID for the P2P connection
     * @param dsk_key The DSK_KEY for the P2P connection
     * @param dsk_key_creation The timestamp the DSK_KEY will be unusable
     * @param actor_id The actor id for P2P communication
     * @param base_ip_address The local ip address of the base
     * @param base_port The port the P2P communication with the base is done
     */
    public setP2PData(baseSerial : string, p2p_did : string,  dsk_key : string,  dsk_key_creation : string, actor_id : string, base_ip_address : string, base_port : string) : void
    {
        var res;
        if(this.isBaseInConfig(baseSerial) == false)
        {
            res = this.updateWithNewBase(baseSerial);
        }
        else
        {
            res = true;
        }
        if (res)
        {
            this.setP2PData_p2p_did(baseSerial, p2p_did);
            this.setP2PData_dsk_key(baseSerial, dsk_key);
            this.setP2PData_dsk_key_creation(baseSerial, dsk_key_creation);
            this.setP2PData_actor_id(baseSerial, actor_id);
            this.setP2PData_base_ip_address(baseSerial, base_ip_address);
            this.setP2PData_base_port(baseSerial, base_port);

            this.writeConfig();
            this.loadConfig();
        }
    }
}
