/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { io, Socket } from 'socket.io-client';
import * as request from 'supertest';

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
  let app: INestApplication;
  let clientSocket1: Socket;
  let clientSocket2: Socket;
  let user1;
  let user2;
  const baseUrl: string = 'http://localhost:3000';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.listen(3000);
    await app.init();

    clientSocket1 = io(baseUrl, { transports: ['websocket'] });
    clientSocket2 = io(baseUrl, { transports: ['websocket'] });

    user1 = await request(app.getHttpServer())
      .post('/users')
      .send({})
      .expect(201);

    user2 = await request(app.getHttpServer())
      .post('/users')
      .send({})
      .expect(201);
  });

  afterAll(async () => {
    clientSocket1.disconnect();
    clientSocket2.disconnect();
    await app.close();
  });

  it('should create chat, send and read messages', async () => {
    clientSocket1.emit('create-chat', {
      usersIds: [user1.body.id, user2.body.id],
    });

    const chatCreated = await waitForEvent<{ chatId: string }>(
      clientSocket1,
      'chat-created',
    );
    const chatId = chatCreated.chatId;

    clientSocket1.emit('join-chat', { chatId });
    clientSocket2.emit('join-chat', { chatId });

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
        'message-sended',
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
  });
});
