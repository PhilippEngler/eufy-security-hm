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
const http_1 = require("http");
const https_1 = require("https");
const fs_1 = require("fs");
const process_1 = require("process");
const eufySecurityApi_1 = require("./eufySecurityApi/eufySecurityApi");
const http_response_models_1 = require("./eufySecurityApi/http/http-response.models");
const logging_1 = require("./eufySecurityApi/utils/logging");
const child_process_1 = require("child_process");
process.chdir(__dirname);
var apiServer;
var serverHttp = http_1.createServer();
var serverHttps = https_1.createServer();
var api = new eufySecurityApi_1.EufySecurityApi();
var logger = new logging_1.Logger();
class ApiServer {
    /**
     * Create the ApiServer-Object.
     */
    constructor() {
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
    startServer(httpActive, portHttp, httpsActive, portHttps, keyHttps, certHttps, logger) {
        return __awaiter(this, void 0, void 0, function* () {
            logger.log("[GOT FROM CONFIG: HTTP: " + portHttp + " / HTTPS: " + portHttps + "]");
            if (httpActive == true) {
                logger.log("Starting http server...");
                serverHttp.on("request", this.requestListener);
                serverHttp.listen(portHttp);
                logger.log("...started. http listening on port '" + portHttp + "'");
            }
            if (httpsActive == true) {
                logger.log("Starting https server...");
                if (fs_1.existsSync(keyHttps) && fs_1.existsSync(certHttps)) {
                    const options = {
                        key: fs_1.readFileSync(keyHttps),
                        cert: fs_1.readFileSync(certHttps)
                    };
                    serverHttps.setSecureContext(options);
                    serverHttps.on("request", this.requestListener);
                    serverHttps.listen(portHttps);
                    logger.log("...started. https listening on port '" + portHttps + "'");
                }
                else {
                    logger.err("FAILED TO START SERVER (HTTPS): key or cert file not found.");
                }
            }
        });
    }
    /**
     * The request listener for the webserver.
     * @param request The request object.
     * @param response The response object.
     */
    requestListener(request, response) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            var responseString = "";
            var url = (_a = request.url) === null || _a === void 0 ? void 0 : _a.split("/");
            if (url == undefined) {
                url = [];
            }
            // We use 'GET' for nearly all function of the api, exept the change of config
            if (request.method == "GET") {
                if (url.length > 1) {
                    switch (url[1]) {
                        case "getDevices":
                            responseString = yield api.getDevices();
                            break;
                        case "getBases":
                            responseString = yield api.getBases();
                            break;
                        case "getMode":
                            if (url.length == 2) {
                                responseString = yield api.getGuardMode();
                            }
                            else if (url.length == 3) {
                                responseString = yield api.getGuardModeBase(url[2]);
                            }
                            break;
                        case "getConfig":
                            responseString = api.getConfig();
                            break;
                        case "getApiInfo":
                            responseString = api.getApiVersion();
                            break;
                        case "setMode":
                            if (url.length == 3) {
                                switch (url[2]) {
                                    case "away":
                                        responseString = yield api.setGuardMode(http_response_models_1.GuardMode.AWAY);
                                        break;
                                    case "custom1":
                                        responseString = yield api.setGuardMode(http_response_models_1.GuardMode.CUSTOM1);
                                        break;
                                    case "custom2":
                                        responseString = yield api.setGuardMode(http_response_models_1.GuardMode.CUSTOM2);
                                        break;
                                    case "custom3":
                                        responseString = yield api.setGuardMode(http_response_models_1.GuardMode.CUSTOM3);
                                        break;
                                    case "disarmed":
                                        responseString = yield api.setGuardMode(http_response_models_1.GuardMode.DISARMED);
                                        break;
                                    case "geo":
                                        responseString = yield api.setGuardMode(http_response_models_1.GuardMode.GEO);
                                        break;
                                    case "home":
                                        responseString = yield api.setGuardMode(http_response_models_1.GuardMode.HOME);
                                        break;
                                    case "off":
                                        responseString = yield api.setGuardMode(http_response_models_1.GuardMode.OFF);
                                        break;
                                    case "schedule":
                                        responseString = yield api.setGuardMode(http_response_models_1.GuardMode.SCHEDULE);
                                        break;
                                    default:
                                        responseString = "{\"success\":false,\"message\":\"Unknown mode to set.\"";
                                }
                            }
                            else if (url.length == 4) {
                                switch (url[3]) {
                                    case "away":
                                        responseString = yield api.setGuardModeBase(url[2], http_response_models_1.GuardMode.AWAY);
                                        break;
                                    case "custom1":
                                        responseString = yield api.setGuardModeBase(url[2], http_response_models_1.GuardMode.CUSTOM1);
                                        break;
                                    case "custom2":
                                        responseString = yield api.setGuardModeBase(url[2], http_response_models_1.GuardMode.CUSTOM2);
                                        break;
                                    case "custom3":
                                        responseString = yield api.setGuardModeBase(url[2], http_response_models_1.GuardMode.CUSTOM3);
                                        break;
                                    case "disarmed":
                                        responseString = yield api.setGuardModeBase(url[2], http_response_models_1.GuardMode.DISARMED);
                                        break;
                                    case "geo":
                                        responseString = yield api.setGuardModeBase(url[2], http_response_models_1.GuardMode.GEO);
                                        break;
                                    case "home":
                                        responseString = yield api.setGuardModeBase(url[2], http_response_models_1.GuardMode.HOME);
                                        break;
                                    case "off":
                                        responseString = yield api.setGuardModeBase(url[2], http_response_models_1.GuardMode.OFF);
                                        break;
                                    case "schedule":
                                        responseString = yield api.setGuardModeBase(url[2], http_response_models_1.GuardMode.SCHEDULE);
                                        break;
                                    default:
                                        responseString = "{\"success\":false,\"message\":\"Unknown mode to set.\"}";
                                }
                            }
                            else {
                                responseString = "{\"success\":false,\"message\":\"Numbers of arguments not matching.\"}";
                            }
                            break;
                        case "checkSystemVariables":
                            responseString = yield api.checkSystemVariables();
                            break;
                        case "createSystemVariable":
                            if (url.length == 3) {
                                responseString = yield api.createSystemVariable(url[2], "");
                            }
                            else if (url.length == 4) {
                                responseString = yield api.createSystemVariable(url[2], url[3]);
                            }
                            else {
                                responseString = "{\"success\":false,\"message\":\"False amount of arguments.\"}";
                            }
                            break;
                        case "getLibrary":
                            if (url.length == 2) {
                                responseString = yield api.getLibrary();
                            }
                            else {
                                responseString = "{\"success\":false,\"message\":\"False amount of arguments.\"}";
                            }
                            break;
                        case "getLogFileContent":
                            responseString = yield api.getLogFileContent();
                            break;
                        case "getErrorFileContent":
                            responseString = yield api.getErrorFileContent();
                            break;
                        default:
                            responseString = "{\"success\":false,\"message\":\"Unknown command.\"}";
                    }
                    response.setHeader('Access-Control-Allow-Origin', '*');
                    response.setHeader('Content-Type', 'application/json; charset=UTF-8');
                    response.writeHead(200);
                    response.end(responseString);
                }
                else {
                    responseString = "{\"success\":false,\"message\":\"Unknown command.\"}";
                    response.setHeader('Access-Control-Allow-Origin', '*');
                    response.setHeader('Content-Type', 'application/json; charset=UTF-8');
                    response.writeHead(200);
                    response.end(responseString);
                }
            }
            // We must handele the change config throught POST because of the form data we send...
            else if (request.method == "POST") {
                if (url.length > 1) {
                    if (url[1] == "setConfig") {
                        var body = "";
                        request.on("data", function (chunk) {
                            body += chunk.toString();
                        });
                        request.on("end", function () {
                            var username = "";
                            if (body.indexOf("email") >= 0) {
                                username = body.substring(body.indexOf("email") + 6);
                                username = username.replace("\r\n", "");
                                username = username.substr(2, username.indexOf("----") - 4);
                            }
                            var password = "";
                            if (body.indexOf("password") >= 0) {
                                password = body.substring(body.indexOf("password") + 9);
                                password = password.replace("\r\n", "");
                                password = password.substr(2, password.indexOf("----") - 4);
                            }
                            var useHttp = false;
                            if (body.indexOf("useHttp") >= 0) {
                                var useHttpStr = body.substring(body.indexOf("useHttp") + 8);
                                useHttpStr = useHttpStr.substr(2, useHttpStr.indexOf("----") - 4);
                                if (useHttpStr.trim() == "on") {
                                    useHttp = true;
                                }
                                else {
                                    useHttp = false;
                                }
                            }
                            var apiporthttp = "52789";
                            if (body.indexOf("portHttp") >= 0) {
                                apiporthttp = body.substring(body.indexOf("portHttp") + 9);
                                apiporthttp = apiporthttp.replace("\r\n", "");
                                apiporthttp = apiporthttp.substr(2, apiporthttp.indexOf("----") - 4);
                            }
                            var useHttps = false;
                            if (body.indexOf("useHttps") >= 0) {
                                var useHttpsStr = body.substring(body.indexOf("useHttps") + 8);
                                useHttpsStr = useHttpsStr.substr(2, useHttpsStr.indexOf("----") - 4);
                                if (useHttpsStr.trim() == "on") {
                                    useHttps = true;
                                }
                                else {
                                    useHttps = false;
                                }
                            }
                            var apiporthttps = "52790";
                            if (body.indexOf("portHttps") >= 0) {
                                apiporthttps = body.substring(body.indexOf("portHttps") + 10);
                                apiporthttps = apiporthttps.replace("\r\n", "");
                                apiporthttps = apiporthttps.substr(2, apiporthttps.indexOf("----") - 4);
                            }
                            var apikeyfile = "/usr/local/etc/config/server.pem";
                            if (body.indexOf("keyFile") >= 0) {
                                apikeyfile = body.substring(body.indexOf("keyFile") + 8);
                                apikeyfile = apikeyfile.replace("\r\n", "");
                                apikeyfile = apikeyfile.substr(2, apikeyfile.indexOf("----") - 4);
                            }
                            var apicertfile = "/usr/local/etc/config/server.pem";
                            if (body.indexOf("certFile") >= 0) {
                                apicertfile = body.substring(body.indexOf("certFile") + 9);
                                apicertfile = apicertfile.replace("\r\n", "");
                                apicertfile = apicertfile.substr(2, apicertfile.indexOf("----") - 4);
                            }
                            var useSystemVariables = false;
                            if (body.indexOf("useSystemVariables") >= 0) {
                                var useSystemVariablesStr = body.substring(body.indexOf("useSystemVariables") + 19);
                                useSystemVariablesStr = useSystemVariablesStr.substr(2, useSystemVariablesStr.indexOf("----") - 4);
                                if (useSystemVariablesStr.trim() == "on") {
                                    useSystemVariables = true;
                                }
                                else {
                                    useSystemVariables = false;
                                }
                            }
                            var apicameradefaultimage = "";
                            if (body.indexOf("imagePath") >= 0) {
                                apicameradefaultimage = body.substring(body.indexOf("imagePath") + 10);
                                apicameradefaultimage = apicameradefaultimage.replace("\r\n", "");
                                apicameradefaultimage = apicameradefaultimage.substr(2, apicameradefaultimage.indexOf("----") - 4);
                            }
                            var apicameradefaultvideo = "";
                            if (body.indexOf("videoPath") >= 0) {
                                apicameradefaultvideo = body.substring(body.indexOf("videoPath") + 10);
                                apicameradefaultvideo = apicameradefaultvideo.replace("\r\n", "");
                                apicameradefaultvideo = apicameradefaultvideo.substr(2, apicameradefaultvideo.indexOf("----") - 4);
                            }
                            responseString = api.setConfig(username, password, useHttp, apiporthttp, useHttps, apiporthttps, apikeyfile, apicertfile, useSystemVariables, apicameradefaultimage, apicameradefaultvideo);
                            var resJSON = JSON.parse(responseString);
                            response.setHeader('Access-Control-Allow-Origin', '*');
                            response.setHeader('Content-Type', 'application/json; charset=UTF-8');
                            response.writeHead(200);
                            response.end(responseString);
                            if (resJSON.serviceRestart == true) {
                                logger.log("Settings saved. Restarting apiServer.");
                                restartServer();
                            }
                            else {
                                logger.log("Settings saved.");
                            }
                        });
                    }
                    else {
                        responseString = "{\"success\":false,\"message\":\"Unknown command.\"}";
                        response.setHeader('Access-Control-Allow-Origin', '*');
                        response.setHeader('Content-Type', 'application/json; charset=UTF-8');
                        response.writeHead(200);
                        response.end(responseString);
                    }
                }
                else {
                    responseString = "{\"success\":false,\"message\":\"Unknown command.\"}";
                    response.setHeader('Access-Control-Allow-Origin', '*');
                    response.setHeader('Content-Type', 'application/json; charset=UTF-8');
                    response.writeHead(200);
                    response.end(responseString);
                }
            }
            // Be polite and give a answer even we know that there is noting to answer...
            else {
                responseString = "{\"success\":false,\"message\":\"Unknown command.\"}";
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Content-Type', 'application/json; charset=UTF-8');
                response.writeHead(200);
                response.end(responseString);
            }
        });
    }
}
/**
 * The main function will start the ApiServer
 */
function main() {
    apiServer = new ApiServer();
}
/**
 * Will stop the server and exit.
 */
function stopServer() {
    logger.log("Write config...");
    api.writeConfig();
    logger.log("Stopping...");
    serverHttp.close();
    logger.log("Stopped...");
}
/**
 * Will write config and restart the server.
 */
function restartServer() {
    return __awaiter(this, void 0, void 0, function* () {
        logger.log("Going to restart with apiServerRestarter...");
        child_process_1.exec("/usr/local/addons/eufySecurity/bin/node /usr/local/addons/eufySecurity/apiServerRestarter.js");
    });
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
    process_1.exit(0);
});
process.on('SIGINT', () => {
    logger.log('SIGTERM signal received. Save config and shutdown server...');
    stopServer();
    logger.log("...done. Exiting");
    process_1.exit(0);
});
main();
