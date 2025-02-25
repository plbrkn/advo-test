import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, PrismaService],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should create a new user', async () => {
    jest
      .spyOn(prismaService.user, 'create')
      .mockResolvedValue({ id: 'test-user-id' });

    const user = await service.createUser();
    expect(user.id).toBeDefined();
    expect(user.id).toEqual('test-user-id');
  });

  it('should get a user by id', async () => {
    jest
      .spyOn(prismaService.user, 'findUnique')
      .mockResolvedValue({ id: 'test-user-id' });

    const user = await service.getUserById('test-user-id');
    expect(user?.id).toBeDefined();
    expect(user?.id).toEqual('test-user-id');
  });

  it('should throw an error if user is not found', async () => {
    jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

    const user = await service.getUserById('test-user-id');
    expect(user).toBeNull();
  });

  it('should check if a user exists', async () => {
    jest
      .spyOn(prismaService.user, 'findUnique')
      .mockResolvedValue({ id: 'test-user-id' });

    const userExists = await service.existsUser('test-user-id');
    expect(userExists).toBe(true);
  });
});
