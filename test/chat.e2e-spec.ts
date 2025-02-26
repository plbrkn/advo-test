/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';

import { io, Socket } from 'socket.io-client';
import * as request from 'supertest';
import { AppBridgeModule } from '../src/app-bridge.module';
import { Transport } from '@nestjs/microservices';

const bridgeOptions = {
  transport: Transport.RMQ,
  options: {
    urls: ['amqp://guest:guest@localhost:5672'],
    queue: 'bridge_queue',
    queueOptions: {
      durable: false,
    },
  },
};

const mainOptions = {
  transport: Transport.RMQ,
  options: {
    urls: ['amqp://guest:guest@localhost:5672'],
    queue: 'main_queue',
    queueOptions: {
      durable: false,
    },
  },
};

const waitForEvent = <T>(
  socket: Socket,
  event: string,
  timeout = 3000,
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event);
      reject(new Error(`Timeout waiting for event: ${event}`));
    }, timeout);

    socket.once(event, (data: T) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
};

describe('ChatGateway (e2e)', () => {
  let appMain: INestApplication;
  let appBridge: INestApplication;
  let clientSocket1: Socket;
  let clientSocket2: Socket;
  let user1;
  let user2;
  const baseUrl: string = 'http://localhost:80';

  beforeAll(async () => {
    const mainModuleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const bridgeModuleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppBridgeModule],
    }).compile();

    appMain = mainModuleFixture.createNestApplication();
    appBridge = bridgeModuleFixture.createNestApplication();

    appMain.connectMicroservice(mainOptions);
    appBridge.connectMicroservice(bridgeOptions);

    await appMain.startAllMicroservices();
    await appBridge.startAllMicroservices();

    await appMain.listen(3000);
    await appBridge.listen(80);

    await appMain.init();
    await appBridge.init();

    clientSocket1 = io(baseUrl, { transports: ['websocket'] });
    clientSocket2 = io(baseUrl, { transports: ['websocket'] });

    user1 = await request(appMain.getHttpServer())
      .post('/users')
      .send({})
      .expect(201);

    user2 = await request(appMain.getHttpServer())
      .post('/users')
      .send({})
      .expect(201);
  });

  afterAll(async () => {
    clientSocket1.disconnect();
    clientSocket2.disconnect();
    await appMain.close();
  });

  it('should create chat, send and read messages', async () => {
    clientSocket1.emit('create-chat', {
      userIds: [user1.body.id, user2.body.id],
    });

    const chatCreated = await waitForEvent<{ chatId: string }>(
      clientSocket1,
      'chat-created',
    );
    const chatId = chatCreated.chatId;

    expect(chatId).toBeDefined();

    clientSocket1.emit('join-chat', { chatId, userId: user1.body.id });
    clientSocket2.emit('join-chat', { chatId, userId: user2.body.id });

    const [join1, join2] = await Promise.all([
      waitForEvent<{ chatId: string }>(clientSocket1, 'chat-joined'),
      waitForEvent<{ chatId: string }>(clientSocket2, 'chat-joined'),
    ]);

    expect(join1.chatId).toEqual(chatId);
    expect(join2.chatId).toEqual(chatId);

    clientSocket1.emit('send-message', {
      chatId,
      senderId: user1.body.id,
      content: 'Test Message',
    });

    const [messageSended1, newMessage1] = await Promise.all([
      waitForEvent<{ chatId: string; senderId: string; content: string }>(
        clientSocket1,
        'message-queued',
      ),
      waitForEvent<{
        id: string;
        chatId: string;
        senderId: string;
        content: string;
      }>(clientSocket2, 'new-message'),
    ]);
    expect(messageSended1.chatId).toEqual(chatId);
    expect(messageSended1.senderId).toEqual(user1.body.id);
    expect(messageSended1.content).toEqual('Test Message');

    expect(newMessage1).toHaveProperty('id');
    expect(newMessage1.chatId).toEqual(chatId);
    expect(newMessage1.senderId).toEqual(user1.body.id);
    expect(newMessage1.content).toEqual('Test Message');

    clientSocket2.emit('read-message', {
      chatId,
      messageId: newMessage1.id,
    });

    const messageRead = await waitForEvent<{
      chatId: string;
      senderId: string;
      content: string;
    }>(clientSocket1, 'message-read');

    expect(messageRead.chatId).toEqual(chatId);
    expect(messageRead.senderId).toEqual(user1.body.id);
    expect(messageRead.content).toEqual('Test Message');

    clientSocket2.disconnect();

    clientSocket1.emit('send-message', {
      chatId,
      senderId: user1.body.id,
      content: 'Test Message 2',
    });

    const messageQueued = await waitForEvent<{
      chatId: string;
      senderId: string;
      content: string;
    }>(clientSocket1, 'message-queued');

    expect(messageQueued.chatId).toEqual(chatId);
    expect(messageQueued.senderId).toEqual(user1.body.id);
    expect(messageQueued.content).toEqual('Test Message 2');

    clientSocket2.connect();

    clientSocket2.emit('join-chat', { chatId, userId: user2.body.id });

    await waitForEvent<{ chatId: string }>(clientSocket2, 'chat-joined');

    const newMessage2 = await waitForEvent<{
      id: string;
      chatId: string;
      senderId: string;
      content: string;
    }>(clientSocket2, 'new-message');

    expect(newMessage2).toHaveProperty('id');
    expect(newMessage2.chatId).toEqual(chatId);
    expect(newMessage2.senderId).toEqual(user1.body.id);
    expect(newMessage2.content).toEqual('Test Message 2');
  });
});
