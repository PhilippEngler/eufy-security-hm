import * as crypto from "crypto";
import { Config } from "./config";

import { InvalidPropertyValueError } from "./error";
import { PropertyMetadataAny, PropertyMetadataNumeric, PropertyMetadataString } from "./http/interfaces";

import { Logger } from "./utils/logging";

export const removeLastChar = function(text: string, char: string): string {
    const strArr = [...text];
    strArr.splice(text.lastIndexOf(char), 1);
    return strArr.join("");
}

export const generateUDID = function(): string {
    return crypto.randomBytes(8).readBigUInt64BE().toString(16);
};

export const generateSerialnumber = function(length: number): string {
    return crypto.randomBytes(length/2).toString("hex");
};

export const md5 = (contents: string): string => crypto.createHash("md5").update(contents).digest("hex");

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const handleUpdate = function(config: Config, log: Logger, oldVersion: number): void {
    if (oldVersion <= 1.24) {
        config.setToken("");
        config.setTokenExpire(0);
    }
    return;
};

export const isEmpty = function(str: string | null | undefined): boolean {
    if (str) {
        if (str.length > 0)
            return false;
        return true;
    }
    return true;
};

export const parseValue = function(metadata: PropertyMetadataAny, value: unknown): unknown {
    if (metadata.type === "boolean") {
        if (value !== undefined) {
            switch (typeof value) {
                case "boolean":
                    break;
                case "number":
                    if (value === 0 || value === 1) {
                        value = value === 1 ? true : false;
                    } else {
                        throw new InvalidPropertyValueError(`Property ${metadata.name} expects a boolean value`);
                    }
                    break;
                case "string":
                    if (value.toLowerCase() === "true" || value.toLowerCase() === "false") {
                        value = value.toLowerCase() === "true" ? true : false;
                    } else {
                        throw new InvalidPropertyValueError(`Property ${metadata.name} expects a boolean value`);
                    }
                    break;
                default:
                    throw new InvalidPropertyValueError(`Property ${metadata.name} expects a boolean value`);
            }
        } else {
            throw new InvalidPropertyValueError(`Property ${metadata.name} expects a boolean value`);
        }
    } else if (metadata.type === "number") {
        if (value !== undefined) {
            switch (typeof value) {
                case "number":
                    break;
                case "string":
                    try {
                        value = Number.parseInt(value);
                    } catch (error) {
                        throw new InvalidPropertyValueError(`Property ${metadata.name} expects a number value`);
                    }
                    break;
                default:
                    throw new InvalidPropertyValueError(`Property ${metadata.name} expects a number value`);
            }
        } else {
            throw new InvalidPropertyValueError(`Property ${metadata.name} expects a number value`);
        }
    } else if (metadata.type === "string") {
        if (value !== undefined) {
            switch (typeof value) {
                case "number":
                    value = value.toString();
                    break;
                case "string":
                    break;
                case "boolean":
                    value = value === true ? "true" : "false";
                    break;
                default:
                    throw new InvalidPropertyValueError(`Property ${metadata.name} expects a number value`);
            }
        } else {
            throw new InvalidPropertyValueError(`Property ${metadata.name} expects a number value`);
        }
    } else {
        throw new InvalidPropertyValueError(`Property ${metadata.name} expects a ${metadata.type} value`);
    }
    return value;
};

export const validValue = function(metadata: PropertyMetadataAny, value: unknown): void {
    if (metadata.type === "number") {
        const numberMetadata = metadata as PropertyMetadataNumeric;
        const numericValue = Number(value);
        if ((numberMetadata.min !== undefined && numberMetadata.min > numericValue) || (numberMetadata.max !== undefined && numberMetadata.max < numericValue) || (numberMetadata.states !== undefined && numberMetadata.states[numericValue] === undefined) || Number.isNaN(numericValue)) {
            throw new InvalidPropertyValueError(`Value "${numericValue}" isn't a valid value for property "${numberMetadata.name}"`);
        }
    } else if (metadata.type === "string") {
        const stringMetadata = metadata as PropertyMetadataString;
        const stringValue = String(value);
        if ((stringMetadata.format !== undefined && stringValue.match(stringMetadata.format) === null) || (stringMetadata.minLength !== undefined && stringMetadata.minLength > stringValue.length) || (stringMetadata.maxLength !== undefined && stringMetadata.maxLength < stringValue.length)) {
            throw new InvalidPropertyValueError(`Value "${stringValue}" isn't a valid value for property "${stringMetadata.name}"`);
        }
    } else if (metadata.type === "boolean") {
        const str = String(value).toLowerCase().trim();
        if (str !== "true" && str !== "false") {
            throw new InvalidPropertyValueError(`Value "${value}" isn't a valid value for property "${metadata.name}"`);
        }
    }
}

export const mergeDeep = function (target: Record<string, any> | undefined,	source: Record<string, any>): Record<string, any> {
    target = target || {};
    for (const [key, value] of Object.entries(source)) {
        if (!(key in target)) {
            target[key] = value;
        } else {
            if (typeof value === "object") {
                // merge objects
                target[key] = mergeDeep(target[key], value);
            } else if (typeof target[key] === "undefined") {
                // don't override single keys
                target[key] = value;
            }
        }
    }
    return target;
}

export const parseJSON = function(data: string, log: Logger): any {
    try {
        return JSON.parse(data.replace(/[\0]+$/g, ""));
    } catch(error) {
        log.error("JSON parse error", data, error);
    }
    return undefined;
}