import { Injectable, Logger } from '@nestjs/common';
import { Message } from '@prisma/client';
import { RMQService } from 'nestjs-rmq';

@Injectable()
export class BrokerService {
  private readonly logger = new Logger(BrokerService.name);

  constructor(private readonly rmqService: RMQService) {}

  async publishMessage(message: Message): Promise<any> {
    const response = await this.rmqService.send<Message, Message>(
      'chat_message',
      message,
    );
    this.logger.log(`Сообщение опубликовано: ${JSON.stringify(message)}`);

    return response;
  }
}
