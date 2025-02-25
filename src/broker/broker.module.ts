import { Module } from '@nestjs/common';
import { RMQModule } from 'nestjs-rmq';

import { BrokerService } from './broker.service';
import { BrokerController } from './broker.controller';

@Module({
  imports: [
    RMQModule.forRoot({
      exchangeName: 'chat',
      serviceName: 'chat',
      connections: [
        {
          login: 'guest',
          password: 'guest',
          host: 'localhost',

          port: 5672,
          vhost: '/',
        },
      ],
      queueName: 'chat_messages',
    }),
  ],
  providers: [BrokerService],
  controllers: [BrokerController],
  exports: [BrokerService],
})
export class BrokerModule {}
