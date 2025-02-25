/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ChatService } from './chat.service';
import { MessageService } from '../message/message.service';
import { BrokerService } from '../broker/broker.service';
import { Message } from '@prisma/client';
import { ExtendedMessage, RMQMessage, RMQRoute } from 'nestjs-rmq';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly messageService: MessageService,
    private readonly brokerService: BrokerService,
  ) {}

  @SubscribeMessage('create-chat')
  async handleCreateChat(
    @MessageBody()
    data: {
      usersIds: Array<string>;
    },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    this.logger.log(`Клиент ${client.id} создает чат`);

    const chat = await this.chatService.createChat(data.usersIds);

    const roomName = this.makeRoomName(chat.id);

    this.logger.log(`Создан чат ${chat.id}`);

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
    this.logger.log(`Клиент ${client.id} присоединился к чату ${data.chatId}`);

    const chat = await this.chatService.getChatByIdWithUserId(
      data.chatId,
      data.userId,
    );

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
    this.logger.log(
      `Получено сообщение от ${client.id}: ${JSON.stringify(data)}`,
    );

    const { chatId, senderId, content } = data;

    const chat = await this.chatService.getChatByIdWithUserId(chatId, senderId);

    if (!chat) {
      throw new Error(`Чат с id ${chatId} не найден`);
    }

    client.emit('message-queued', {
      chatId,
      senderId,
      content,
      status: 'QUEUED',
    });

    const message = await this.messageService.createMessage(
      chatId,
      senderId,
      content,
    );

    await this.brokerService.publishMessage(message);
  }

  @SubscribeMessage('read-message')
  async handleReadMessage(
    @MessageBody()
    data: {
      chatId: string;
      messageId: string;
    },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    this.logger.log(
      `Получено сообщение от ${client.id}: ${JSON.stringify(data)}`,
    );

    const message = await this.messageService.readMessage(data.messageId);

    this.server
      .to(this.makeRoomName(data.chatId))
      .emit('message-read', message);
  }

  @RMQRoute('chat_message')
  async handleChatMessage(message: Message, @RMQMessage msg: ExtendedMessage) {
    this.logger.log(
      `Получено сообщение из RabbitMQ: ${JSON.stringify(message)}`,
    );

    const dispatchMessage = await this.messageService.dispatchMessage(
      message.id,
    );

    this.server
      .to(this.makeRoomName(message.chatId))
      .emit('new-message', dispatchMessage);

    return dispatchMessage;
  }

  private makeRoomName(chatId: string) {
    return `chat-${chatId}`;
  }
}
