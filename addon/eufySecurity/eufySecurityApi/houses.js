"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EufyHouses = void 0;
const tiny_typed_emitter_1 = require("tiny-typed-emitter");
/**
 * Represents all the Houses the account has access to.
 */
class EufyHouses extends tiny_typed_emitter_1.TypedEmitter {
    /**
     * Create the Houses objects holding all houses in the account.
     * @param api The eufySecurityApi.
     * @param httpService The httpService.
     */
    constructor(api, httpService) {
        super();
        //private houses: Houses = {};
        this.houses = {};
        this.api = api;
        this.httpService = httpService;
        this.httpService.on("houses", (houses) => this.handleHouses(houses));
    }
    /**
     * Handle the houses of the account.
     * @param houses The houses object.
     */
    handleHouses(houses) {
        this.api.logDebug("Got houses:", houses);
        //TODO: Finish implementation
        this.houses = houses;
    }
    /**
     * Returns all houses of the account.
     * @returns All houses of the account.
     */
    getHouses() {
        return this.houses;
    }
    /**
     * Returns a house object of the specified house.
     * @param house_id The houseId.
     * @returns The house object.
     */
    getHouse(house_id) {
        return this.houses[house_id];
    }
}
exports.EufyHouses = EufyHouses;