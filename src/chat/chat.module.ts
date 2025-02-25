import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { ChatService } from './chat.service';
import { ChatsController } from './chat.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [UsersModule, PrismaModule],
  providers: [ChatService],
  exports: [ChatService],
  controllers: [ChatsController],
})
export class ChatModule {}
