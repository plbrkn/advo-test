import { Module } from '@nestjs/common';
import { BridgeModule } from './bridge/bridge.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    BridgeModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppBridgeModule {}
