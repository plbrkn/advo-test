import { Module } from '@nestjs/common';
import { BridgeModule } from './bridge/bridge.module';

@Module({
  imports: [BridgeModule],
  controllers: [],
  providers: [],
})
export class AppBridgeModule {}
