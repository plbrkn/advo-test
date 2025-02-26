import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AppBridgeModule } from './app-bridge.module';

async function bootstrap() {
  const main = await NestFactory.create(AppModule);

  const appBridge = await NestFactory.create(AppBridgeModule);

  const appConfigService = main.get(ConfigService);

  const RABBITMQ_URL = appConfigService.get<string>(
    'RABBITMQ_URL',
    'amqp://guest:guest@localhost:5672',
  );

  console.log(RABBITMQ_URL);

  const bridgeOptions: MicroserviceOptions = {
    transport: Transport.RMQ,
    options: {
      urls: [RABBITMQ_URL],
      queue: 'bridge_queue',
      queueOptions: {
        durable: false,
      },
    },
  };

  const mainOptions: MicroserviceOptions = {
    transport: Transport.RMQ,
    options: {
      urls: [RABBITMQ_URL],
      queue: 'main_queue',
      queueOptions: {
        durable: false,
      },
    },
  };

  appBridge.connectMicroservice(bridgeOptions);

  main.connectMicroservice(mainOptions);

  await main.startAllMicroservices();
  await appBridge.startAllMicroservices();

  await appBridge.listen(80);

  await main.listen(process.env.PORT ?? 3000);
}
void bootstrap();
