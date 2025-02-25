/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { ChatService } from './chat.service';
import { UsersService } from '../users/users.service';

describe('UsersService', () => {
  let service: ChatService;
  let prismaService: PrismaService;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatService, PrismaService, UsersService],
    }).compile();

    service = module.get<ChatService>(ChatService);
    prismaService = module.get<PrismaService>(PrismaService);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be create the chat', async () => {
    const usersIds = ['1', '2'];

    const chat = {
      id: '1',
      users: usersIds,
    };

    jest.spyOn(usersService, 'existsUser').mockResolvedValue(true);
    jest.spyOn(prismaService.chat, 'create').mockResolvedValue(chat as any);
    jest.spyOn(prismaService.chat, 'findFirst').mockResolvedValue(null);

    const newChat = await service.createChat(usersIds);
    expect(newChat.id).toBe(chat.id);
    expect(newChat.users).toEqual(chat.users);
  });
});
