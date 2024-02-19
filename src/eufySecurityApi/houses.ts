import { TypedEmitter } from "tiny-typed-emitter";
import { EufySecurityApi } from "./eufySecurityApi";
import { EufySecurityEvents } from "./interfaces";
import { HTTPApi, HouseDetail, Houses } from "./http";
import { rootAddonLogger } from "./logging";

/**
 * Represents all the Houses the account has access to.
 */
export class EufyHouses extends TypedEmitter<EufySecurityEvents>
{
    private api : EufySecurityApi;
    private httpService : HTTPApi;

    //private houses: Houses = {};
    private houses : { [houseId : string] : any } = {};

    /**
     * Create the Houses objects holding all houses in the account.
     * @param api The eufySecurityApi.
     * @param httpService The httpService.
     */
    constructor(api : EufySecurityApi, httpService : HTTPApi)
    {
        super();
        this.api = api;
        this.httpService = httpService;

        this.httpService.on("houses", (houses: Houses) => this.handleHouses(houses));
    }

    /**
     * Handle the houses of the account.
     * @param houses The houses object.
     */
    private handleHouses(houses: Houses) : void
    {
        rootAddonLogger.debug("Got houses", { houses: houses });
        //TODO: Finish implementation
        this.houses = houses;
    }

    /**
     * Returns all houses of the account.
     * @returns All houses of the account.
     */
    public getHouses() : Houses
    {
        return this.houses;
    }

    /**
     * Returns a house object of the specified house.
     * @param house_id The houseId.
     * @returns The house object.
     */
    public async getHouse(house_id : string) : Promise<HouseDetail | null>
    {
        return await this.httpService.getHouseDetail(house_id);
    }
}