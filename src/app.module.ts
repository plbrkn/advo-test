import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { BrokerModule } from './broker/broker.module';

@Module({
  imports: [PrismaModule, UsersModule, BrokerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
