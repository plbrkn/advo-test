import { Module } from '@nestjs/common';

import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { ChatModule } from './chat/chat.module';
import { MessageModule } from './message/message.module';
import { BrokerModule } from './broker/broker.module';

@Module({
  imports: [PrismaModule, UsersModule, ChatModule, MessageModule, BrokerModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
