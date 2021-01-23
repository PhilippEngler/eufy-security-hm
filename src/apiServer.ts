import { createServer as createServerHttp, IncomingMessage, ServerResponse } from 'http';
import { createServer as createServerHttps } from 'https';
import { existsSync, readFileSync } from 'fs';
import { exit } from 'process';
import { EufySecurityApi } from './eufySecurityApi/eufySecurityApi';
import { GuardMode } from './eufySecurityApi/http/http-response.models';
import { Logger } from './eufySecurityApi/utils/logging';
import { exec } from 'child_process';

process.chdir(__dirname);
var apiServer !: ApiServer;
var serverHttp = createServerHttp();
var serverHttps = createServerHttps();
var api = new EufySecurityApi();
var logger = new Logger();

class ApiServer
{
    /**
     * Create the ApiServer-Object.
     */
    constructor()
    {
        this.startServer(api.getApiUseHttp(), api.getApiServerPortHttp(), api.getApiUseHttps(), api.getApiServerPortHttps(), api.getApiServerKeyHttps(), api.getApiServerCertHttps(), logger);
    }

    /**
     * Start the server.
     * @param httpActive The http should be used.
     * @param portHttp The HTTP port the server will serve.
     * @param httpsActive The https server should be used.
     * @param portHttps The HTTPS port the server will serve.
     * @param keyHttps The key for https.
     * @param certHttps The cert for https.
     * @param logger The logger component.
     */
    public async startServer(httpActive : boolean, portHttp : number, httpsActive : boolean, portHttps : number, keyHttps : string, certHttps : string, logger : Logger)
    {
        if(httpActive == true)
        {
            logger.log("Starting http server...");
            serverHttp.on("error", this.errorListener)
            serverHttp.on("request", this.requestListener);
            serverHttp.listen(portHttp);
            logger.log("...started. http listening on port '"+ portHttp + "'");
        }

        if(httpsActive == true)
        {
            logger.log("Starting https server...");
            if(existsSync(keyHttps) && existsSync(certHttps))
            {
                const options = {
                    key: readFileSync(keyHttps),
                    cert: readFileSync(certHttps)
                };
                serverHttps.setSecureContext(options);
                serverHttps.on("error", this.errorListener)
                serverHttps.on("request", this.requestListener);
                serverHttps.listen(portHttps);
                logger.log("...started. https listening on port '"+ portHttps + "'");
            }
            else
            {
                logger.err("FAILED TO START SERVER (HTTPS): key or cert file not found.");
            }
        }
    }

    /**
     * The error listener for the webserver.
     * @param error The error object.
     */
    private async errorListener (error : any) : Promise<void>
    {
        if(error.code == "EADDRINUSE")
        {
            logger.err("ERROR: " + error.code + ": port \'" + error.port + "\' already in use.");
        }
        else
        {
            logger.err("ERROR: " + error.code + ": " + error.message);
        }
    }
    
    /**
     * The request listener for the webserver.
     * @param request The request object.
     * @param response The response object.
     */
    private async requestListener (request : IncomingMessage, response : ServerResponse) : Promise<void>
    {
        var responseString = "";

        var url = request.url?.split("/");

        if(url == undefined)
        {
            url = [];
        }

        // We use 'GET' for nearly all function of the api, exept the change of config
        if(request.method == "GET")
        {
            if(url.length > 1)
            {
                switch (url[1])
                {
                    case "getDevices":
                        responseString = await api.getDevices();
                        break;
                    case "getBases":
                        responseString = await api.getBases();
                        break;
                    case "getMode":
                        if(url.length == 2)
                        {
                            responseString = await api.getGuardMode();
                        }
                        else if(url.length == 3)
                        {
                            responseString = await api.getGuardModeBase(url[2]);
                        }
                        break;
                    case "getConfig":
                        responseString = api.getConfig();
                        break;
                    case "getApiInfo":
                        responseString = api.getApiVersion();
                        break;
                    case "setMode":
                        if(url.length == 3)
                        {
                            switch (url[2])
                            {
                                case "away":
                                    responseString = await api.setGuardMode(GuardMode.AWAY);
                                    break;
                                case "custom1":
                                    responseString = await api.setGuardMode(GuardMode.CUSTOM1);
                                    break;
                                case "custom2":
                                    responseString = await api.setGuardMode(GuardMode.CUSTOM2);
                                    break;
                                case "custom3":
                                    responseString = await api.setGuardMode(GuardMode.CUSTOM3);
                                    break;
                                case "disarmed":
                                    responseString = await api.setGuardMode(GuardMode.DISARMED);
                                    break;
                                case "geo":
                                    responseString = await api.setGuardMode(GuardMode.GEO);
                                    break;
                                case "home":
                                    responseString = await api.setGuardMode(GuardMode.HOME);
                                    break;
                                case "off":
                                    responseString = await api.setGuardMode(GuardMode.OFF);
                                    break;
                                case "schedule":
                                    responseString = await api.setGuardMode(GuardMode.SCHEDULE);
                                    break;
                                default:
                                    responseString = "{\"success\":false,\"message\":\"Unknown mode to set.\"";
                            }
                        }
                        else if(url.length == 4)
                        {
                            switch (url[3])
                            {
                                case "away":
                                    responseString = await api.setGuardModeBase(url[2], GuardMode.AWAY);
                                    break;
                                case "custom1":
                                    responseString = await api.setGuardModeBase(url[2], GuardMode.CUSTOM1);
                                    break;
                                case "custom2":
                                    responseString = await api.setGuardModeBase(url[2], GuardMode.CUSTOM2);
                                    break;
                                case "custom3":
                                    responseString = await api.setGuardModeBase(url[2], GuardMode.CUSTOM3);
                                    break;
                                case "disarmed":
                                    responseString = await api.setGuardModeBase(url[2], GuardMode.DISARMED);
                                    break;
                                case "geo":
                                    responseString = await api.setGuardModeBase(url[2], GuardMode.GEO);
                                    break;
                                case "home":
                                    responseString = await api.setGuardModeBase(url[2], GuardMode.HOME);
                                    break;
                                case "off":
                                    responseString = await api.setGuardModeBase(url[2], GuardMode.OFF);
                                    break;
                                case "schedule":
                                    responseString = await api.setGuardModeBase(url[2], GuardMode.SCHEDULE);
                                    break;
                                default:
                                    responseString = "{\"success\":false,\"message\":\"Unknown mode to set.\"}";
                            }
                        }
                        else
                        {
                            responseString = "{\"success\":false,\"message\":\"Numbers of arguments not matching.\"}";
                        }
                        break;
                    case "checkSystemVariables":
                        responseString = await api.checkSystemVariables();
                        break;
                    case "createSystemVariable":
                        if(url.length == 3)
                        {
                            responseString = await api.createSystemVariable(url[2], "");
                        }
                        else if(url.length == 4)
                        {
                            responseString = await api.createSystemVariable(url[2], url[3]);
                        }
                        else
                        {
                            responseString = "{\"success\":false,\"message\":\"False amount of arguments.\"}";
                        }
                        break;
                    case "getLibrary":
                        if(url.length == 2)
                        {
                            responseString = await api.getLibrary();
                        }
                        else
                        {
                            responseString = "{\"success\":false,\"message\":\"False amount of arguments.\"}";
                        }
                        break;
                    case "getLogFileContent":
                        responseString = await api.getLogFileContent();
                        break;
                    case "getErrorFileContent":
                        responseString = await api.getErrorFileContent();
                        break;
                    case "removeTokenData":
                        responseString = api.setTokenData("", "0");
                        break;
                    case "clearLogFile":
                        emptyLogFile();
                        responseString = "{\"success\":true}";
                        break;
                    case "clearErrFile":
                        emptyErrFile();
                        responseString = "{\"success\":true}";
                        break;
                    default:
                        responseString = "{\"success\":false,\"message\":\"Unknown command.\"}";
                        
                }
                
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Content-Type', 'application/json; charset=UTF-8');

                response.writeHead(200);
                response.end(responseString);
            }
            else
            {
                responseString = "{\"success\":false,\"message\":\"Unknown command.\"}";
                
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Content-Type', 'application/json; charset=UTF-8');

                response.writeHead(200);
                response.end(responseString);
            }
        }
        // We must handele the change config throught POST because of the form data we send...
        else if(request.method == "POST")
        {
            if(url.length > 1)
            {
                if (url[1] == "setConfig")
                {
                    var body = "";
                    request.on("data", function (chunk) {
                        body += chunk.toString();
                    });

                    request.on("end", function(){
                        var username = "";
                        if(body.indexOf("email") >= 0)
                        {
                            username = body.substring(body.indexOf("email") + 6);
                            username = username.replace("\r\n","");
                            username = username.substr(2, username.indexOf("----") - 4);
                        }
                        
                        var password = "";
                        if(body.indexOf("password") >= 0)
                        {
                            password = body.substring(body.indexOf("password") + 9);
                            password = password.replace("\r\n","");
                            password = password.substr(2, password.indexOf("----") - 4);
                        }

                        var useHttp = false;
                        if(body.indexOf("useHttp") >= 0)
                        {
                            var useHttpStr = body.substring(body.indexOf("useHttp") + 8);
                            useHttpStr = useHttpStr.substr(2, useHttpStr.indexOf("----") - 4);
                            if(useHttpStr.trim() == "on")
                            {
                                useHttp = true;
                            }
                            else
                            {
                                useHttp = false;
                            }
                        }
                        
                        var apiporthttp = "52789";
                        if(body.indexOf("portHttp") >= 0)
                        {
                            apiporthttp = body.substring(body.indexOf("portHttp") + 9);
                            apiporthttp = apiporthttp.replace("\r\n","");
                            apiporthttp = apiporthttp.substr(2, apiporthttp.indexOf("----") - 4);
                        }
                        
                        var useHttps = false;
                        if(body.indexOf("useHttps") >= 0)
                        {
                            var useHttpsStr = body.substring(body.indexOf("useHttps") + 8);
                            useHttpsStr = useHttpsStr.substr(2, useHttpsStr.indexOf("----") - 4);
                            if(useHttpsStr.trim() == "on")
                            {
                                useHttps = true;
                            }
                            else
                            {
                                useHttps = false;
                            }
                        }

                        var apiporthttps = "52790";
                        if(body.indexOf("portHttps") >= 0)
                        {
                            apiporthttps = body.substring(body.indexOf("portHttps") + 10);
                            apiporthttps = apiporthttps.replace("\r\n","");
                            apiporthttps = apiporthttps.substr(2, apiporthttps.indexOf("----") - 4);
                        }

                        var apikeyfile = "/usr/local/etc/config/server.pem";
                        if(body.indexOf("keyFile") >= 0)
                        {
                            apikeyfile = body.substring(body.indexOf("keyFile") + 8);
                            apikeyfile = apikeyfile.replace("\r\n","");
                            apikeyfile = apikeyfile.substr(2, apikeyfile.indexOf("----") - 4);
                        }

                        var apicertfile = "/usr/local/etc/config/server.pem";
                        if(body.indexOf("certFile") >= 0)
                        {
                            apicertfile = body.substring(body.indexOf("certFile") + 9);
                            apicertfile = apicertfile.replace("\r\n","");
                            apicertfile = apicertfile.substr(2, apicertfile.indexOf("----") - 4);
                        }

                        var useSystemVariables = false;
                        if(body.indexOf("useSystemVariables") >= 0)
                        {
                            var useSystemVariablesStr = body.substring(body.indexOf("useSystemVariables") + 19);
                            useSystemVariablesStr = useSystemVariablesStr.substr(2, useSystemVariablesStr.indexOf("----") - 4);
                            if(useSystemVariablesStr.trim() == "on")
                            {
                                useSystemVariables = true;
                            }
                            else
                            {
                                useSystemVariables = false;
                            }
                        }

                        var apicameradefaultimage = "";
                        if(body.indexOf("imagePath") >= 0)
                        {
                            apicameradefaultimage = body.substring(body.indexOf("imagePath") + 10);
                            apicameradefaultimage = apicameradefaultimage.replace("\r\n","");
                            apicameradefaultimage = apicameradefaultimage.substr(2, apicameradefaultimage.indexOf("----") - 4);
                        }

                        var apicameradefaultvideo = "";
                        if(body.indexOf("videoPath") >= 0)
                        {
                            apicameradefaultvideo = body.substring(body.indexOf("videoPath") + 10);
                            apicameradefaultvideo = apicameradefaultvideo.replace("\r\n","");
                            apicameradefaultvideo = apicameradefaultvideo.substr(2, apicameradefaultvideo.indexOf("----") - 4);
                        }

                        responseString = api.setConfig(username, password, useHttp, apiporthttp, useHttps, apiporthttps, apikeyfile, apicertfile, useSystemVariables, apicameradefaultimage, apicameradefaultvideo);

                        var resJSON = JSON.parse(responseString);
                                                
                        response.setHeader('Access-Control-Allow-Origin', '*');
                        response.setHeader('Content-Type', 'application/json; charset=UTF-8');
                        
                        response.writeHead(200);
                        response.end(responseString);

                        if(resJSON.serviceRestart == true)
                        {
                            logger.log("Settings saved. Restarting apiServer.");
                            restartServer();
                        }
                        else
                        {
                            logger.log("Settings saved.");
                        }
                    });
                }
                else
                {
                    responseString = "{\"success\":false,\"message\":\"Unknown command.\"}";
                    response.setHeader('Access-Control-Allow-Origin', '*');
                    response.setHeader('Content-Type', 'application/json; charset=UTF-8');

                    response.writeHead(200);
                    response.end(responseString);
                }
            }
            else
            {
                responseString = "{\"success\":false,\"message\":\"Unknown command.\"}";
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Content-Type', 'application/json; charset=UTF-8');

                response.writeHead(200);
                response.end(responseString);
            }
        }
        // Be polite and give a answer even we know that there is noting to answer...
        else
        {
            responseString = "{\"success\":false,\"message\":\"Unknown command.\"}";
            response.setHeader('Access-Control-Allow-Origin', '*');
            response.setHeader('Content-Type', 'application/json; charset=UTF-8');

            response.writeHead(200);
            response.end(responseString);
        }
    }
}

/**
 * The main function will start the ApiServer
 */
function main()
{
    apiServer = new ApiServer();
}

/**
 * Will stop the server and exit.
 */
function stopServer()
{
    logger.log("Write config...");
    api.writeConfig();
    logger.log("Stopping...");
    serverHttp.close();
    logger.log("Stopped...");
}

/**
 * Will write config and restart the server.
 */
async function restartServer()
{
    logger.log("Going to restart with apiServerRestarter...");
    exec("/usr/local/addons/eufySecurity/bin/node /usr/local/addons/eufySecurity/apiServerRestarter.js");
}

/**
 * Clear the logfile
 */
function emptyLogFile()
{
    exec("rm /var/log/eufySecurity.log");
    exec("touch /var/log/eufySecurity.log");
}

/**
 * Clear the errorlogfile
 */
function emptyErrFile()
{
    exec("rm /var/log/eufySecurity.err");
    exec("touch /var/log/eufySecurity.err");
}

/**
 * Wait-function for waing between stop and start when restarting. 
 */
function wait10Seconds() {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve("");
        }, 10000);
    });
}

process.on('SIGTERM', () => {
    logger.log('SIGTERM signal received. Save config and shutdown server...');
    stopServer();
    logger.log("...done. Exiting");
    exit(0);
});

process.on('SIGINT', () => {
    logger.log('SIGTERM signal received. Save config and shutdown server...');
    stopServer();
    logger.log("...done. Exiting");
    exit(0);
});

main();