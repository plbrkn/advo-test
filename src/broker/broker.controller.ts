import { Controller, Logger } from '@nestjs/common';
import { RMQRoute } from 'nestjs-rmq';

@Controller()
export class BrokerController {
  private readonly logger = new Logger(BrokerController.name);

  @RMQRoute('chat_message')
  handleChatMessage(message: unknown) {
    this.logger.log(
      `Получено сообщение из RabbitMQ: ${JSON.stringify(message)}`,
    );

    return { status: 'processed' };
  }
}
