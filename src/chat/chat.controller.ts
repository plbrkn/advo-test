import {
  Controller,
  Post,
  Get,
  Param,
  NotFoundException,
  Body,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { Chat } from '@prisma/client';
import { CreateChatDto } from './create-chat.dto';

@Controller('chats')
export class ChatsController {
  constructor(private chatService: ChatService) {}

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
}
