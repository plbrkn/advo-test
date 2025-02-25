import { Injectable } from '@nestjs/common';
import { Message, MessageStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessageService {
  constructor(private readonly prisma: PrismaService) {}

  async createMessage(
    chatId: string,
    senderId: string,
    content: string,
  ): Promise<Message> {
    return this.prisma.message.create({
      data: {
        content,
        status: MessageStatus.CREATED,
        chat: {
          connect: { id: chatId },
        },
        sender: {
          connect: { id: senderId },
        },
      },
    });
  }

  async readMessage(messageId: string): Promise<Message> {
    return this.prisma.message.update({
      where: { id: messageId },
      data: {
        status: MessageStatus.READ,
      },
    });
  }

  async deliverMessage(messageId: string): Promise<Message> {
    return this.prisma.message.update({
      where: { id: messageId },
      data: {
        status: MessageStatus.DELIVERED,
      },
    });
  }
}
