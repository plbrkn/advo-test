import { Injectable } from '@nestjs/common';
import { RMQService } from 'nestjs-rmq';

@Injectable()
export class BrokerService {
  constructor(private readonly rmqService: RMQService) {}

  async publishMessage(message: unknown): Promise<unknown> {
    const response = await this.rmqService.send('chat_message', {
      payload: message,
    });

    return response;
  }
}
