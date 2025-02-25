import { Injectable } from '@nestjs/common';
import { Chat, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async createChat(
    usersIds: Array<string>,
  ): Promise<Chat & { users: Array<User> }> {
    if (usersIds.length < 2) {
      throw new Error('A chat must have at least 2 users');
    }

    const usersExist = await Promise.all(
      usersIds.map((userId) => this.usersService.existsUser(userId)),
    );

    if (!usersExist.every(Boolean)) {
      throw new Error('One or more users do not exist');
    }

    const existsChatWithUsers = await this.existsChatWithUsers(usersIds);

    if (existsChatWithUsers) {
      throw new Error('A chat with these users already exists');
    }

    return this.prisma.chat.create({
      data: {},
      include: {
        users: true,
      },
    });
  }

  async getChatById(id: string): Promise<Chat | null> {
    return this.prisma.chat.findUnique({ where: { id } });
  }

  private async existsChatWithUsers(usersIds: Array<string>): Promise<boolean> {
    const chat = await this.prisma.chat.findFirst({
      where: {
        users: {
          every: {
            id: {
              in: usersIds,
            },
          },
        },
      },
    });

    return !!chat;
  }
}
