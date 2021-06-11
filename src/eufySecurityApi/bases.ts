import { EufySecurityApi } from './eufySecurityApi';
import { HTTPApi, Hubs, Station, GuardMode } from './http';
import { P2PConnectionType } from './p2p';
import { sleep } from './push/utils';

/**
 * Represents all the Bases in the account.
 */
export class Bases
{
    private api : EufySecurityApi;
    private httpService : HTTPApi;
    private serialNumbers : string[];
    private resBases !: Hubs;
    private bases : {[key:string] : Station} = {};

    /**
     * Create the Bases objects holding all bases in the account.
     * @param api The eufySecurityApi.
     * @param httpService The httpService.
     */
    constructor(api : EufySecurityApi, httpService : HTTPApi)
    {
        this.api = api;
        this.httpService = httpService;
        this.serialNumbers = [];
    }

    /**
     * (Re)Loads all Bases and the settings of them.
     */
    public async loadBases() : Promise<void>
    {
        try
        {
            await this.httpService.updateDeviceInfo();
            this.resBases = this.httpService.getHubs();
            var key : string;
            var base : Station;
            
            if(this.resBases != null)
            {
                for (key in this.resBases)
                {
                    if(this.bases[key])
                    {
                        this.bases[key].update(this.resBases[key]);
                    }
                    else
                    {
                        base = new Station(this.api, this.httpService, this.resBases[key]);
                        this.bases[base.getSerial()] = base;
                        this.serialNumbers.push(base.getSerial());
                        await this.bases[key].connect(P2PConnectionType.ONLY_LOCAL);
                    }
                }
                
                await this.saveBasesSettings();
            }
            else
            {
                this.bases = {};
            }
        }
        catch (e)
        {
            this.bases = {};
            throw new Error(e);
        }
    }

    /**
     * Close all P2P connection for all bases.
     */
    public async closeP2PConnections() : Promise<void>
    {
        if(this.resBases != null)
        {
            for (var key in this.resBases)
            {
                if(this.bases[key])
                {
                    await this.bases[key].close();
                }
            }
        }
    }

    /**
     * Save the relevant settings (mainly for P2P-Connection) to the config
     */
    public async saveBasesSettings() : Promise<void>
    {
        await this.api.saveBasesSettings(this.bases, this.serialNumbers);
    }

    /**
     * Returns a JSON-Representation of all Bases including the guard mode.
     */
    public getBases() : {[key: string] : Station}
    {
        return this.bases;
    }

    /**
     * Get the guard mode for all bases.
     */
    public getGuardMode() : {[key: string] : Station}
    {
        return this.getBases();
    }

    /**
     * Set the guard mode of all bases to the given mode.
     * @param guardMode The target guard mode.
     */
    public async setGuardMode(guardMode : GuardMode) : Promise<boolean>
    {
        var cnt = 0;
        for (var key in this.bases)
        {
            var base = this.bases[key];
            await base.setGuardMode(guardMode)
            await sleep(1500);
            await this.loadBases();
            if(base.getGuardMode().value as number != guardMode)
            {
                cnt = cnt + 1;
            }
        }
        if(cnt == 0)
        {
            return true;
        }
        else
        {
            return false;
        }
    }

    /**
     * Set the guard mode for the given base to the given mode.
     * @param baseSerial The serial of the base the mode to change.
     * @param guardMode The target guard mode.
     */
    public async setGuardModeBase(baseSerial : string, guardMode : GuardMode) : Promise<boolean>
    {
        await this.bases[baseSerial].setGuardMode(guardMode);
        await sleep(1500);
        await this.loadBases();
        if(this.bases[baseSerial].getGuardMode().value as number == guardMode)
        {
            return true;
        }
        else
        {
            return false;
        }
    }
}