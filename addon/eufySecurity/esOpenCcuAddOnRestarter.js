"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_child_process_1 = require("node:child_process");
const logging_1 = require("./eufySecurityApi/logging");
try {
    let timeStamp = Date.now();
    timeStamp = Date.now();
    (0, node_child_process_1.execFile)('tclsh', ['/usr/local/addons/eufySecurity/www/serviceManager.cgi', 'action=restartService'], (err, stdout, stderr) => {
        if (stdout.trim().includes(`{"success":true}`)) {
            console.log(`${(0, logging_1.formatDate)(timeStamp)} INFO  [addon] ...restart command sent successfully.`);
        }
        else {
            console.log(`${(0, logging_1.formatDate)(timeStamp)} ERROR [addon] Error during restart - Result: ${stdout.trim()}`);
        }
        if (err !== null) {
            console.log(`${(0, logging_1.formatDate)(timeStamp)} ERROR [addon] Error during restart - Result: ${stdout.trim()}`);
            console.log(`${(0, logging_1.formatDate)(timeStamp)} ERROR [addon] Error during restart - Error: ${JSON.stringify(err)}`);
            console.log(`${(0, logging_1.formatDate)(timeStamp)} ERROR [addon] Error during restart - Error output: ${stderr.trim()}`);
            console.error(`${(0, logging_1.formatDate)(timeStamp)} ERROR [addon] Error during restart: ${JSON.stringify(err)}`);
            console.error(`${(0, logging_1.formatDate)(timeStamp)} ERROR [addon] Error during restart - Error output: ${stderr.trim()}`);
        }
        if (stderr.trim() !== "" && err === null) {
            console.log(`${(0, logging_1.formatDate)(timeStamp)} ERROR [addon] Error during restart - Error output: ${stderr.trim()}`);
        }
    });
}
catch (err) {
    const timeStamp = Date.now();
    console.log(`${(0, logging_1.formatDate)(timeStamp)} ERROR [addon] Error during restart: ${JSON.stringify(err)}`);
}
