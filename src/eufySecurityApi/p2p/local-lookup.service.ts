import { createSocket, Socket, RemoteInfo } from 'dgram';
import { sendMessage, hasHeader, RequestMessageType, ResponseMessageType } from './message.utils';
import { Address } from './models';

export class LocalLookupService {
  private readonly LOCAL_PORT = 32108;
  private readonly addressTimeoutInMs = 3 * 1000;

  private async bind(socket: Socket, portNumber : Number): Promise<void> {
    return new Promise((resolve) => {
      socket.bind(portNumber.valueOf(), () => resolve());
    });
  }

  private async close(socket: Socket): Promise<void> {
    return new Promise((resolve) => {
      socket.close(() => resolve());
    });
  }

  public async lookup(host: string, portNumber : Number): Promise<Address> {
    return new Promise(async (resolve, reject) => {
      let timer: NodeJS.Timeout | null = null;

      const socket = createSocket('udp4');
      socket.on('error', (error: Error) => reject(error));
      this.bind(socket, portNumber);

      socket.on('message', (msg: Buffer, rinfo: RemoteInfo) => {
        if (hasHeader(msg, ResponseMessageType.LOCAL_LOOKUP_RESP)) {
          if (!!timer) {
            clearTimeout(timer);
          }
          this.close(socket);
          resolve({ host: rinfo.address, port: rinfo.port });
        }
      });

      const payload = Buffer.from([0, 0]);
      await sendMessage(socket, { host: host, port: this.LOCAL_PORT }, RequestMessageType.LOCAL_LOOKUP, payload);

      timer = setTimeout(() => {
        this.close(socket);
        reject(`Timeout on local address: ${host}:${this.LOCAL_PORT}`);
      }, this.addressTimeoutInMs);
    });
  }
}
