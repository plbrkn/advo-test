import {
  Controller,
  Post,
  Get,
  Param,
  NotFoundException,
  Body,
  Inject,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { Chat } from '@prisma/client';
import { CreateChatDto } from './create-chat.dto';
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';
import { MessageService } from '../message/message.service';
import { GetChatDto } from './get-chat.dto';
import { NewMessageDto } from './new-message.dto';
import { ReadMessageDto } from './read-message.dto';

@Controller('chats')
export class ChatsController {
  constructor(
    private chatService: ChatService,
    private readonly messageService: MessageService,
    @Inject('bridge') private client: ClientProxy,
  ) {}

  @Post()
  async createChat(@Body() createChatDto: CreateChatDto): Promise<Chat> {
    return this.chatService.createChat(createChatDto.userIds);
  }

  @Get(':id')
  async getChat(@Param('id') id: string): Promise<Chat> {
    const chat = await this.chatService.getChatById(id);

    if (!chat) {
      throw new NotFoundException(`Chat with id ${id} not found`);
    }

    return chat;
  }

  @MessagePattern('create-chat')
  async handleCreateChat(@Payload() data: CreateChatDto) {
    const chat = await this.chatService.createChat(data.userIds);

    return chat;
  }

  @MessagePattern('get-chat')
  async handleGetChat(@Payload() data: GetChatDto) {
    const { chatId, userId } = data;

    if (userId) {
      const chat = await this.chatService.getChatByIdWithUserId(chatId, userId);
      return chat;
    }

    const chat = await this.chatService.getChatById(chatId);

    return chat;
  }

  @MessagePattern('new-message')
  async handleNewMessage(@Payload() data: NewMessageDto) {
    const { chatId, senderId, content } = data;

    const chat = await this.chatService.getChatById(chatId);

    if (!chat) {
      throw new NotFoundException(`Chat with id ${chatId} not found`);
    }

    const message = await this.messageService.createMessage(
      chatId,
      senderId,
      content,
    );

    this.client.emit('message-created', message);

    return message;
  }

  @MessagePattern('read-message')
  async handleReadMessage(@Payload() data: ReadMessageDto) {
    const { messageId } = data;

    const message = await this.messageService.readMessage(messageId);

    return message;
  }
}
