import { EufySecurityApi } from './../eufySecurityApi';
import { postRequest } from './http.utils';
import { LoginResult, Hub, DeviceRequest, FullDevice, DskKey, Stream, ResultWrapper } from './http-response.models';
import { HistoryRecordRequest, StreamRequest } from './http-request.models';

export class HttpService {
  //private baseUrl = 'https://mysecurity.eufylife.com/api/v1';
  private baseUrl = 'https://security-app-eu.eufylife.com/v1';
  private currentLoginResult: LoginResult | null = null;
  private headers = {
    app_version: 'v2.0.1_676',
    os_type: 'android',
    os_version: '25',
    phone_model: 'SM-G930L',
    country: 'DE',
    language: 'de',
    openudid: '',
    uid: '',
    net_type: 'wifi',
    mnc: '01',
    mcc: '001',
    sn: '',
    model_type: 'PHONE',
    'user-agent': 'okhttp/3.12.1',
  };

  constructor(private username: string, private password: string, private api: EufySecurityApi) { }

  public async listHubs(): Promise<Array<Hub>> {
    return await this.requestWithToken(`/app/get_hub_list`);
  }

  public async listDevices(deviceRequest?: Partial<DeviceRequest>): Promise<Array<FullDevice>> {
    const reqBody = {
      device_sn: '',
      num: 100,
      orderby: '',
      page: 0,
      station_sn: '',
      ...deviceRequest,
    };

    return await this.requestWithToken<Array<FullDevice>>(`/app/get_devs_list`, reqBody);
  }

  public async stationDskKeys(station_sns: string): Promise<DskKey> {
    const reqBody = { station_sns: [station_sns] };
    return await this.requestWithToken<DskKey>(`/app/equipment/get_dsk_keys`, reqBody);
  }

  public async allHistoryRecord(historyRecord?: HistoryRecordRequest): Promise<any> {
    const reqBody = {
      device_sn: '',
      end_time: 0,
      id: 0,
      num: 100,
      offset: -14400,
      pullup: true,
      shared: true,
      start_time: 0,
      storage: 0,
      ...historyRecord,
    };
    return await this.requestWithToken(`/event/app/get_all_history_record`, reqBody);
  }

  public async startStream(startStreamRequest: StreamRequest): Promise<Stream> {
    const reqBody = {
      proto: 2,
      ...startStreamRequest,
    };
    return await this.requestWithToken(`/web/equipment/start_stream`, reqBody);
  }

  public async stopStream(stopStreamRequest: StreamRequest): Promise<void> {
    const reqBody = {
      proto: 2,
      ...stopStreamRequest,
    };
    return await this.requestWithToken(`/web/equipment/stop_stream`, reqBody);
  }

  public async pushTokenCheck(): Promise<ResultWrapper> {
    const reqBody = {
      app_type: 'eufySecurity',
      transaction: '',
    };
    return await this.requestWithToken<ResultWrapper>(`/app/review/app_push_check`, reqBody, this.headers);
  }

  public async registerPushToken(pushToken: string): Promise<ResultWrapper> {
    const reqBody = {
      is_notification_enable: true,
      token: pushToken,
      transaction: '',
    };
    return await this.requestWithToken<ResultWrapper>(`/apppush/register_push_token`, reqBody, this.headers);
  }

  private async requestWithToken<T>(
    path: string,
    body?: Record<string, unknown> | undefined,
    headers?: Record<string, unknown>,
  ): Promise<T> {
    try
    {
      const token = await this.getToken();
      return await postRequest(`${this.baseUrl}${path}`, body, token, headers);
    }
    catch (e)
    {
      if(e.message.indexOf("401") > 0)
      {
        try
        {
          this.api.addToErr("HTTPError 401: removing token data and retry.");
          this.api.setTokenData("", "0");
          const token = await this.getToken();
          return await postRequest(`${this.baseUrl}${path}`, body, token, headers);
        }
        catch (e)
        {
          this.api.addToErr("HTTPError 401: please check your account data.");
          throw new Error(e);
        }
      }
      else
      {
        this.api.addToErr(e + " | call: " + this.baseUrl + path);
        throw new Error(e);
      }
    }
  }

  private async getToken(): Promise<string> {
    if (!this.api.getToken() || this.isTokenOutdated()) {
      this.api.addToLog("No token or token outdated. Create new token.");
      this.currentLoginResult = await this.login(this.username, this.password);
      if (this.currentLoginResult)
      {
        this.api.setTokenData(this.currentLoginResult.auth_token, this.currentLoginResult.token_expires_at.toString());
        this.api.writeConfig();
        this.api.addToLog("Got new token.");
      }
      else
      {
        this.api.addToErr("Login failed.");
      }
    }

    return this.api.getToken();
  }

  private isTokenOutdated(): boolean {
    const now = Math.floor(+new Date() / 1000);
    return parseInt(this.api.getTokenExpire()) <= now;
  }

  private async login(email: string, password: string): Promise<LoginResult> {
    const result = await postRequest<LoginResult>(`${this.baseUrl}/passport/login`, { email, password });
    if (!!result.domain) {
      const baseUrlFromResult = `https://${result.domain}/v1`;

      if (baseUrlFromResult !== this.baseUrl) {
        // Only recall login if we're not already on the returned domain
        this.baseUrl = baseUrlFromResult;
        return this.login(email, password);
      }
    }
    return result;
  }
}
