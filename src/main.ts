import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

import { AppModule } from './app.module';
import { AppBridgeModule } from './app-bridge.module';

async function bootstrap() {
  const bridgeOptions: MicroserviceOptions = {
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://guest:guest@localhost:5672'],
      queue: 'bridge_queue',
      queueOptions: {
        durable: false,
      },
    },
  };

  const mainOptions: MicroserviceOptions = {
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://guest:guest@localhost:5672'],
      queue: 'main_queue',
      queueOptions: {
        durable: false,
      },
    },
  };

  const main = await NestFactory.create(AppModule);

  const appBridge = await NestFactory.create(AppBridgeModule);

  appBridge.connectMicroservice(bridgeOptions);

  main.connectMicroservice(mainOptions);

  await main.startAllMicroservices();
  await appBridge.startAllMicroservices();

  await appBridge.listen(80);

  await main.listen(process.env.PORT ?? 3000);
}
void bootstrap();
