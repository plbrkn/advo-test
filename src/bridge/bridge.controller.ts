import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BridgeGateway } from './bridge.gateway';
import { MessageCreatedDto } from './message-created.dto';

@Controller('bridge')
export class BridgeController {
  constructor(private readonly bridgeGateway: BridgeGateway) {}

  @MessagePattern('message-created')
  handleCreatedMessage(@Payload() message: MessageCreatedDto) {
    return this.bridgeGateway.sendNewMessage(message);
  }
}
