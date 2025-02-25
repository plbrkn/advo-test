/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import * as request from 'supertest';

describe('Users (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.listen(3001);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create user successfully', async () => {
    const user = await request(app.getHttpServer())
      .post('/users')
      .send({})
      .expect(201);

    return request(app.getHttpServer())
      .get(`/users/${user.body.id}`)
      .expect(200);
  });
});
