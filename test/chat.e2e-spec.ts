/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { io, Socket } from 'socket.io-client';
import * as request from 'supertest';

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

  it('should create chat successfully', (done) => {
    clientSocket1.emit('create-chat', {
      usersIds: [user1.body.id, user2.body.id],
    });

    clientSocket1.once('chat-created', (chat: any) => {
      const chatId = chat.chatId;

      clientSocket1.emit('join-chat', { chatId });
      clientSocket2.emit('join-chat', { chatId });

      clientSocket1.once('chat-joined', (data) => {
        expect(data.chatId).toEqual(chatId);
      });

      clientSocket2.once('chat-joined', (data) => {
        expect(data.chatId).toEqual(chatId);
      });

      clientSocket1.emit('send-message', {
        chatId,
        senderId: user1.body.id,
        content: 'Test Message',
      });

      clientSocket1.once('message-sended', (data) => {
        expect(data.chatId).toEqual(chatId);
        expect(data.senderId).toEqual(user1.body.id);
        expect(data.content).toEqual('Test Message');
      });

      clientSocket2.once('new-message', (message) => {
        expect(message).toHaveProperty('id');
        expect(message.chatId).toEqual(chatId);
        expect(message.senderId).toEqual(user1.body.id);
        expect(message.content).toEqual('Test Message');

        clientSocket2.emit('read-message', {
          chatId,
          messageId: message.id,
        });

        clientSocket1.once('message-read', (data) => {
          try {
            expect(data.chatId).toEqual(chatId);
            expect(data.senderId).toEqual(user1.body.id);
            expect(data.content).toEqual('Test Message');
            done();
          } catch (error) {
            done(error);
          }
        });
      });
    });
  });
});
