import { Module } from '@nestjs/common';
import { BridgeController } from './bridge.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BridgeGateway } from './bridge.gateway';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'bridge',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://guest:guest@localhost:5672'],
          queue: 'bridge_queue',
          queueOptions: {
            durable: false,
          },
        },
      },

      {
        name: 'main',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://guest:guest@localhost:5672'],
          queue: 'main_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),
  ],
  providers: [BridgeGateway],
  exports: [],
  controllers: [BridgeController],
})
export class BridgeModule {}
