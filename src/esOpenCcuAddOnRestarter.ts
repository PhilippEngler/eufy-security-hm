import { execFile } from "node:child_process";

import { formatDate } from "./eufySecurityApi/logging";

try {
    let timeStamp = Date.now();
    timeStamp = Date.now();
    execFile("tclsh", ["/usr/local/addons/eufySecurity/www/serviceManager.cgi", "action=restartService"], (err, stdout, stderr) => {
        if(stdout.trim().includes(`{"success":true}`)) {
            console.log(`${formatDate(timeStamp)} INFO  [addon] ...restart command sent successfully.`);
        } else {
            console.log(`${formatDate(timeStamp)} ERROR [addon] Error during restart - Result: ${stdout.trim()}`);
        }
        if(err !== null) {
            console.log(`${formatDate(timeStamp)} ERROR [addon] Error during restart - Result: ${stdout.trim()}`);
            console.log(`${formatDate(timeStamp)} ERROR [addon] Error during restart - Error: ${JSON.stringify(err)}`);
            console.log(`${formatDate(timeStamp)} ERROR [addon] Error during restart - Error output: ${stderr.trim()}`);
            console.error(`${formatDate(timeStamp)} ERROR [addon] Error during restart: ${JSON.stringify(err)}`);
            console.error(`${formatDate(timeStamp)} ERROR [addon] Error during restart - Error output: ${stderr.trim()}`);
        }
        if(stderr.trim() !== "" && err === null) {
            console.log(`${formatDate(timeStamp)} ERROR [addon] Error during restart - Error output: ${stderr.trim()}`);
        }
    });
} catch (err: any) {
    const timeStamp = Date.now();
    console.log(`${formatDate(timeStamp)} ERROR [addon] Error during restart: ${JSON.stringify(err)}`);
}