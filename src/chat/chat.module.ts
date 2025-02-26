import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { ChatService } from './chat.service';
import { ChatsController } from './chat.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MessageModule } from '../message/message.module';
import { ClientsModule, Transport } from '@nestjs/microservices';

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
    UsersModule,
    PrismaModule,
    MessageModule,
  ],
  providers: [ChatService],
  exports: [ChatService],
  controllers: [ChatsController],
})
export class ChatModule {}
