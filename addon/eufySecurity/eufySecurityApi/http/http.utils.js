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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.promiseAny = exports.postRequest = void 0;
const got_1 = __importDefault(require("got"));
const postRequest = (api, url, requestBody, token, headers = {}) => __awaiter(void 0, void 0, void 0, function* () {
    const jsonBody = !!requestBody ? { json: Object.assign({}, requestBody) } : {};
    const resultHeaders = !!token ? { headers: Object.assign(Object.assign({}, headers), { 'x-auth-token': token }) } : Object.assign({}, headers);
    const { body } = yield got_1.default.post(url, Object.assign(Object.assign(Object.assign({}, jsonBody), resultHeaders), { responseType: 'json' }));
    const anyBody = body;
    if (anyBody.code !== 0) {
        throw new Error(`Request failed: ${url} -> ${anyBody.code} - ${anyBody.msg}`);
    }
    api.logDebug(`url: ${url} -> body: ${JSON.stringify(body)}`);
    if (!!anyBody.data) {
        return anyBody.data;
    }
    return body;
});
exports.postRequest = postRequest;
const promiseAny = (iterable) => {
    return reverse(Promise.all([...iterable].map(reverse)));
};
exports.promiseAny = promiseAny;
const reverse = (promise) => {
    return new Promise((resolve, reject) => Promise.resolve(promise).then(reject, resolve));
};
