export * from "./http";
export * from "./p2p";
export * from "./push";
export * from "./interfaces";
export * from "./error";
export * from "./utils/utils";

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const libVersion: string = require("../package.json").version;