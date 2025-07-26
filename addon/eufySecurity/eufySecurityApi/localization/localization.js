"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Localization = void 0;
const i18next_1 = __importDefault(require("i18next"));
const i18next_fs_backend_1 = __importDefault(require("i18next-fs-backend"));
const path_1 = __importDefault(require("path"));
const logging_1 = require("../logging");
/**
 * Provide localization for the add-on (the webUI is handeled individually).
 */
class Localization {
    api;
    /**
     * Create the localization object.
     */
    constructor(api) {
        this.api = api;
    }
    /**
     * Initialize the localizazion.
     */
    async initTranslator() {
        i18next_1.default.use(i18next_fs_backend_1.default);
        await i18next_1.default.init({
            fallbackLng: "en",
            lng: this.api.getLanguage(),
            ns: ["common", "systemVariables"],
            backend: {
                loadPath: path_1.default.join(__dirname, "./{{lng}}/{{ns}}.json")
            }
        });
    }
    /**
     * Initialize the localizazion.
     * @param api The EufySecurityApi.
     */
    static async initialize(api) {
        logging_1.rootI18nLogger.info("Initializing i18next...");
        const translator = new Localization(api);
        await translator.initTranslator();
        logging_1.rootI18nLogger.info(`  current language: ${translator.getCurrentLanguage()}`);
        logging_1.rootI18nLogger.info("...done initializing i18next");
        return translator;
    }
    /**
     * Change the language for the localization.
     * @param language The language to set.
     */
    async changeLanguage(language) {
        await i18next_1.default.changeLanguage(language);
        logging_1.rootI18nLogger.info(`Language changed. New language: ${this.getCurrentLanguage()}`);
    }
    /**
     * Translate the given text with the given agrument.
     * @param textToTranslate The text to translate.
     * @param additionalOptionsObj The argument for translation as JSON object.
     * @returns The translated text.
     */
    translateString(textToTranslate, additionalOptionsObj) {
        if (additionalOptionsObj === undefined) {
            return i18next_1.default.t(textToTranslate);
        }
        else {
            var additionalOptions = JSON.parse(additionalOptionsObj);
            return i18next_1.default.t(textToTranslate, additionalOptions);
        }
    }
    /**
     * Returns the current language.
     * @returns The current language.
     */
    getCurrentLanguage() {
        return i18next_1.default.language;
    }
}
exports.Localization = Localization;
