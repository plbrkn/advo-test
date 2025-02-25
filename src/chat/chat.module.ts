import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { ChatService } from './chat.service';
import { ChatsController } from './chat.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatGateway } from './chat.gateway';
import { MessageModule } from '../message/message.module';
import { BrokerModule } from '../broker/broker.module';

@Module({
  imports: [UsersModule, PrismaModule, MessageModule, BrokerModule],
  providers: [ChatService, ChatGateway],
  exports: [ChatService],
  controllers: [ChatsController],
})
export class ChatModule {}
