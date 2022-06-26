import { TypedEmitter } from "tiny-typed-emitter";
import { EufySecurityApi } from './eufySecurityApi';
import { EufySecurityEvents } from './interfaces';
import { HTTPApi, Hubs, Station, GuardMode, PropertyValue, RawValues, DeviceType, HouseDetail, Houses } from './http';
import { sleep } from './push/utils';
import { Devices } from "./devices";

/**
 * Represents all the Houses the account has access to.
 */
export class EufyHouses extends TypedEmitter<EufySecurityEvents>
{
    private api : EufySecurityApi;
    private httpService : HTTPApi;

    //private houses: Houses = {};
    private houses : {[houseId:string] : any} = {};
    
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

    private handleHouses(houses: Houses) : void
    {
        this.api.logDebug("Got houses:", houses);
        //TODO: Finish implementation
        this.houses = houses;
    }

    public getHouses() : Houses
    {
        return this.houses;
    }

    public getHouse(house_id : string) : HouseDetail
    {
        return this.houses[house_id];
    }
}