import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class BridgeService {
  constructor(@Inject('bridge') private client: ClientProxy) {}

  createChat(userIds: Array<string>) {
    this.client.emit('createChat', userIds);
  }
}
