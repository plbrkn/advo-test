import { Inject } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ClientProxy } from '@nestjs/microservices';
import { Chat, Message } from '@prisma/client';
import { MessageCreatedDto } from './message-created.dto';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class BridgeGateway {
  @WebSocketServer()
  server: Server;

  constructor(@Inject('main') private client: ClientProxy) {}

  @SubscribeMessage('create-chat')
  async handleCreateChat(
    @MessageBody()
    data: {
      userIds: Array<string>;
    },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const chat = await this.client.send<Chat>('create-chat', data).toPromise();

    if (!chat) {
      throw new Error('Чат не создан');
    }

    const roomName = this.makeRoomName(chat.id);

    await client.join(roomName);

    this.server.to(roomName).emit('chat-created', { chatId: chat.id });
  }

  @SubscribeMessage('join-chat')
  async handleJoinChat(
    @MessageBody()
    data: {
      userId: string;
      chatId: string;
    },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const chat = await this.client
      .send<Chat>('get-chat', {
        chatId: data.chatId,
        userId: data.userId,
      })
      .toPromise();

    if (!chat) {
      throw new Error(`Чат с id ${data.chatId} не найден`);
    }

    const roomName = this.makeRoomName(chat.id);

    await client.join(roomName);

    this.server.to(roomName).emit('chat-joined', { chatId: chat.id });
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @MessageBody()
    data: {
      chatId: string;
      senderId: string;
      content: string;
    },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const { chatId, senderId, content } = data;

    const chat = await this.client
      .send<Chat>('get-chat', {
        chatId: data.chatId,
        userId: data.senderId,
      })
      .toPromise();

    if (!chat) {
      throw new Error(`Чат с id ${chatId} не найден`);
    }

    this.client.emit('new-message', data);

    client.emit('message-queued', {
      chatId,
      senderId,
      content,
      status: 'QUEUED',
    });
  }

  @SubscribeMessage('read-message')
  async handleReadMessage(
    @MessageBody()
    data: {
      chatId: string;
      messageId: string;
    },
  ): Promise<void> {
    const message = await this.client
      .send<Message>('read-message', {
        messageId: data.messageId,
      })
      .toPromise();

    this.server
      .to(this.makeRoomName(data.chatId))
      .emit('message-read', message);
  }

  sendNewMessage(message: MessageCreatedDto) {
    const chatId = message.chatId;

    const roomName = this.makeRoomName(chatId);

    this.server.to(roomName).emit('new-message', message);
  }

  private makeRoomName(chatId: string) {
    return `chat-${chatId}`;
  }
}
