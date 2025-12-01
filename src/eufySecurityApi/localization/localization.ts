import i18n from "i18next";
import Backend from "i18next-fs-backend";
import { EufySecurityApi } from "../eufySecurityApi";
import path from "path";
import { rootI18nLogger } from "../logging";

/**
 * Provide localization for the add-on (the webUI is handeled individually).
 */
export class Localization{
    private api: EufySecurityApi;

    /**
     * Create the localization object.
     */
    constructor(api: EufySecurityApi) {
        this.api = api;
    }

    /**
     * Initialize the localizazion.
     */
    private async initTranslator(): Promise<void> {
        i18n.use(Backend);
        await i18n.init({
            fallbackLng: "en",
            lng: this.api.getLanguage(),
            ns: ["common", "systemVariables"],
            backend: {
                loadPath: path.join(__dirname, "./{{lng}}/{{ns}}.json")
            }
        });
    }

    /**
     * Initialize the localizazion.
     * @param api The EufySecurityApi.
     */
    static async initialize(api: EufySecurityApi): Promise<Localization> {
        rootI18nLogger.info("Initializing i18next...");
        const translator = new Localization(api);
        await translator.initTranslator();
        rootI18nLogger.info(`  current language: ${translator.getCurrentLanguage()}`);
        rootI18nLogger.info("...done initializing i18next");
        return translator;
    }

    /**
     * Change the language for the localization.
     * @param language The language to set.
     */
    public async changeLanguage(language: string): Promise<void> {
        await i18n.changeLanguage(language);
        rootI18nLogger.info(`Language changed. New language: ${this.getCurrentLanguage()}`);
    }

    /**
     * Translate the given text with the given agrument.
     * @param textToTranslate The text to translate.
     * @param additionalOptionsObj The argument for translation as JSON object.
     * @returns The translated text.
     */
    public translateString(textToTranslate: string, additionalOptionsObj?: string ): string {
        if (additionalOptionsObj === undefined) {
            return i18n.t(textToTranslate);
        } else {
            const additionalOptions = JSON.parse(additionalOptionsObj) as { string: string | string[] };
            return i18n.t(textToTranslate, additionalOptions);
        }
    }

    /**
     * Returns the current language.
     * @returns The current language.
     */
    public getCurrentLanguage(): string {
        return i18n.language;
    }
}