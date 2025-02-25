/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { MessageService } from './message.service';

describe('UsersService', () => {
  let service: MessageService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MessageService, PrismaService],
    }).compile();

    service = module.get<MessageService>(MessageService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be create the message', async () => {
    const message = {
      chatId: '1',
      senderId: '1',
      content: 'Hello',
      status: 'CREATED',
    };

    jest
      .spyOn(prismaService.message, 'create')
      .mockResolvedValue(message as any);

    const newMessage = await service.createMessage(
      message.chatId,
      message.senderId,
      message.content,
    );

    expect(newMessage.chatId).toBe(message.chatId);
    expect(newMessage.senderId).toBe(message.senderId);
    expect(newMessage.content).toBe(message.content);
    expect(newMessage.status).toBe('CREATED');
  });

  it('should be read the message', async () => {
    const message = {
      id: '1',
      status: 'READ',
    };

    jest
      .spyOn(prismaService.message, 'update')
      .mockResolvedValue(message as any);

    const updatedMessage = await service.readMessage(message.id);

    expect(updatedMessage.id).toBe(message.id);
    expect(updatedMessage.status).toBe('READ');
  });

  it('should be deliver the message', async () => {
    const message = {
      id: '1',
      status: 'DELIVERED',
    };

    jest
      .spyOn(prismaService.message, 'update')
      .mockResolvedValue(message as any);

    const updatedMessage = await service.deliverMessage(message.id);

    expect(updatedMessage.id).toBe(message.id);
    expect(updatedMessage.status).toBe('DELIVERED');
  });
});
