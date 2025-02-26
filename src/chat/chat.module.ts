import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { ChatService } from './chat.service';
import { ChatsController } from './chat.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MessageModule } from '../message/message.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: 'bridge',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              configService.get<string>('RABBITMQ_URL') ||
                'amqp://guest:guest@localhost:5672',
            ],
            queue: 'bridge_queue',
            queueOptions: {
              durable: false,
            },
          },
        }),
        inject: [ConfigService],
      },

      {
        name: 'main',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              configService.get<string>('RABBITMQ_URL') ||
                'amqp://guest:guest@localhost:5672',
            ],
            queue: 'main_queue',
            queueOptions: {
              durable: false,
            },
          },
        }),
        inject: [ConfigService],
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
