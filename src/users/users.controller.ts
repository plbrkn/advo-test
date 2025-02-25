import { Controller, Post, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  async createUser(): Promise<User> {
    return this.usersService.createUser();
  }

  @Get(':id')
  async getUser(@Param('id') id: string): Promise<User> {
    const user = await this.usersService.getUserById(id);
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}
