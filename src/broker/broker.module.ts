import { Module } from '@nestjs/common';
import { RMQModule } from 'nestjs-rmq';

import { BrokerService } from './broker.service';
import { MessageModule } from '../message/message.module';

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
    MessageModule,
  ],
  providers: [BrokerService],
  exports: [BrokerService],
})
export class BrokerModule {}
