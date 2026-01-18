"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EsOpenCcuAddOn = void 0;
const node_child_process_1 = require("node:child_process");
const node_os_1 = require("node:os");
const node_process_1 = require("node:process");
const node_path_1 = require("node:path");
const apiServer_1 = require("./apiServer/apiServer");
const logging_1 = require("./eufySecurityApi/logging");
const eufySecurityApi_1 = require("./eufySecurityApi/eufySecurityApi");
const utils_1 = require("./eufySecurityApi/utils/utils");
process.chdir(__dirname);
let esOpenCcuAddOn;
let api;
let apiServer;
/**
 * The main function will start the EsOpenCcuAddOn.
 */
function main() {
    esOpenCcuAddOn = new EsOpenCcuAddOn();
    esOpenCcuAddOn.startAddOn();
}
/**
 * The EsOpenCcuAddOn class.
 */
class EsOpenCcuAddOn {
    /**
     * Create the EsOpenCcuAddOn class.
     */
    constructor() {
        logging_1.InternalLogger.logger = logging_1.dummyLogger;
        (0, utils_1.setPathToNodeJs)(process.execPath);
        (0, utils_1.setPathToApp)(__dirname);
        (0, utils_1.setPathToHttpServerFiles)((0, node_path_1.join)(__dirname, "/www"));
    }
    /**
     * Start the AddOn.
     */
    async startAddOn() {
        api = new eufySecurityApi_1.EufySecurityApi();
        logging_1.rootAddonLogger.debug(`Set Node.js executable path to: '${(0, utils_1.getPathToNodeJs)()}'`);
        logging_1.rootAddonLogger.debug(`Set add on path to: '${(0, utils_1.getPathToApp)()}'`);
        logging_1.rootAddonLogger.debug(`Set http server files path to: '${(0, utils_1.getPathToHttpServerFiles)()}'`);
        logging_1.rootAddonLogger.info(`eufy-security-hm version v${api.getEufySecurityApiVersion()} (${api.getEufySecurityClientVersion()})`);
        logging_1.rootAddonLogger.info(`  Host: ${node_os_1.hostname}`);
        logging_1.rootAddonLogger.info(`  Platform: ${node_os_1.platform}_${node_os_1.arch}`);
        logging_1.rootAddonLogger.info(`  Node: ${process.version}`);
        apiServer = new apiServer_1.ApiServer(api, this);
        await apiServer.startServer();
    }
    /**
     * Preparation for stop the AddOn.
     */
    async stopAddOn() {
        logging_1.rootAddonLogger.info("Set service state to shutdown...");
        api.setServiceState("shutdown");
        logging_1.rootAddonLogger.info("Stopping scheduled tasks...");
        api.clearScheduledTasks();
        logging_1.rootAddonLogger.info("Stopping EufySecurityApi...");
        await api.close();
        logging_1.rootAddonLogger.info("Write config...");
        api.writeConfig();
        logging_1.rootAddonLogger.info("Stopping http and https server...");
        apiServer.stopServer();
        logging_1.rootAddonLogger.info("Stopped...");
    }
    /**
     * Restart the AddOn.
     */
    async restartAddOn() {
        logging_1.rootAddonLogger.info("Going to restart with esOpenCcuAddOnRestarter...");
        await this.stopAddOn();
        (0, node_child_process_1.exec)(`${(0, utils_1.getPathToNodeJs)()} "/usr/local/addons/eufySecurity/esOpenCcuAddOnRestarter.js" >> "/var/log/eufySecurity.log" 2>> "/var/log/eufySecurity.err"`);
    }
}
exports.EsOpenCcuAddOn = EsOpenCcuAddOn;
/**
 * Will write config, stop the server and exit.
 */
/*async function gracefulExit(): Promise<void> {
    rootAddonLogger.info("Set service state to shutdown...");
    api.setServiceState("shutdown");
    rootAddonLogger.info("Stopping scheduled tasks...");
    api.clearScheduledTasks();
    rootAddonLogger.info("Stopping EufySecurityApi...");
    await api.close();
    rootAddonLogger.info("Write config...");
    api.writeConfig();
    rootAddonLogger.info("Stopping...");
    apiServer.stopServer();
    rootAddonLogger.info("Stopped...");
}*/
/**
 * Will write config and restart the server.
 */
/*export async function restartAddOn(): Promise<void> {
    rootAddonLogger.info("Going to restart with esOpenCcuAddOnRestarter...");
    await gracefulExit();
    exec(`${pathToNodeJs}/node "/usr/local/addons/eufySecurity/esOpenCcuAddOnRestarter.js" >> "/var/log/eufySecurity.log" 2>> "/var/log/eufySecurity.err"`);
}*/
process.on("SIGTERM", async () => {
    logging_1.rootAddonLogger.info("SIGTERM signal received. Save config and shutdown addon...");
    if (esOpenCcuAddOn !== undefined) {
        await esOpenCcuAddOn.stopAddOn();
    }
    logging_1.rootAddonLogger.info("...done. Exiting");
    (0, node_process_1.exit)(0);
});
process.on("SIGINT", async () => {
    logging_1.rootAddonLogger.info("SIGINT signal received. Save config and shutdown addon...");
    if (esOpenCcuAddOn !== undefined) {
        await esOpenCcuAddOn.stopAddOn();
    }
    logging_1.rootAddonLogger.info("...done. Exiting");
    (0, node_process_1.exit)(0);
});
main();
