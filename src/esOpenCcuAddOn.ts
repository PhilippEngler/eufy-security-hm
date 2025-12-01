import { exec } from "node:child_process";
import { arch as osArch, hostname as osHostname, platform as osPlatform } from "node:os";
import { exit } from "node:process";
import { join } from "node:path";

import { ApiServer } from "./apiServer/apiServer";
import { dummyLogger, InternalLogger, rootAddonLogger } from "./eufySecurityApi/logging";
import { EufySecurityApi } from "./eufySecurityApi/eufySecurityApi";
import { getPathToApp, getPathToHttpServerFiles, getPathToNodeJs, setPathToApp, setPathToHttpServerFiles, setPathToNodeJs } from "./eufySecurityApi/utils/utils";

process.chdir(__dirname);
let esOpenCcuAddOn: EsOpenCcuAddOn;
let api: EufySecurityApi;
let apiServer: ApiServer;

/**
 * The main function will start the EsOpenCcuAddOn.
 */
function main(): void {
    esOpenCcuAddOn = new EsOpenCcuAddOn();
    esOpenCcuAddOn.startAddOn();
}

/**
 * The EsOpenCcuAddOn class.
 */
export class EsOpenCcuAddOn {
    /**
     * Create the EsOpenCcuAddOn class.
     */
    constructor() {
        InternalLogger.logger = dummyLogger;
        setPathToNodeJs(process.execPath);
        setPathToApp(__dirname);
        setPathToHttpServerFiles(join(__dirname, "/www"));
    }

    /**
     * Start the AddOn.
     */
    public async startAddOn(): Promise<void> {
        api = new EufySecurityApi();

        rootAddonLogger.debug(`Set Node.js executable path to: '${getPathToNodeJs()}'`);
        rootAddonLogger.debug(`Set add on path to: '${getPathToApp()}'`);
        rootAddonLogger.debug(`Set http server files path to: '${getPathToHttpServerFiles()}'`);

        rootAddonLogger.info(`eufy-security-hm version v${api.getEufySecurityApiVersion()} (${api.getEufySecurityClientVersion()})`);
        rootAddonLogger.info(`  Host: ${osHostname}`);
        rootAddonLogger.info(`  Platform: ${osPlatform}_${osArch}`);
        rootAddonLogger.info(`  Node: ${process.version}`);

        apiServer = new ApiServer(api, this);
        await apiServer.startServer();
    }

    /**
     * Preparation for stop the AddOn.
     */
    public async stopAddOn(): Promise<void> {
        rootAddonLogger.info("Set service state to shutdown...");
        api.setServiceState("shutdown");
        rootAddonLogger.info("Stopping scheduled tasks...");
        api.clearScheduledTasks();
        rootAddonLogger.info("Stopping EufySecurityApi...");
        await api.close();
        rootAddonLogger.info("Write config...");
        api.writeConfig();
        rootAddonLogger.info("Stopping http and https server...");
        apiServer.stopServer();
        rootAddonLogger.info("Stopped...");
    }

    /**
     * Restart the AddOn.
     */
    public async restartAddOn(): Promise<void> {
        rootAddonLogger.info("Going to restart with esOpenCcuAddOnRestarter...");
        await this.stopAddOn();
        exec(`${getPathToNodeJs()} "/usr/local/addons/eufySecurity/esOpenCcuAddOnRestarter.js" >> "/var/log/eufySecurity.log" 2>> "/var/log/eufySecurity.err"`);
    }
}

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
    rootAddonLogger.info("SIGTERM signal received. Save config and shutdown addon...");
    if (esOpenCcuAddOn !== undefined) {
        await esOpenCcuAddOn.stopAddOn();
    }
    rootAddonLogger.info("...done. Exiting");
    exit(0);
});

process.on("SIGINT", async () => {
    rootAddonLogger.info("SIGINT signal received. Save config and shutdown addon...");
    if (esOpenCcuAddOn !== undefined) {
        await esOpenCcuAddOn.stopAddOn();
    }
    rootAddonLogger.info("...done. Exiting");
    exit(0);
});

main();