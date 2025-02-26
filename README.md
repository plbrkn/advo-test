# Requirements

- Docker
- Docker Compose
- Node.js
- NPM
- PostgreSQL
- RabbitMQ

# Prepare for local development

```bash
npm install
npx prisma generate
npx prisma migrate deploy
create .env file with the following content:
  DATABASE_URL="postgresql://<user>:<password>@localhost:5432/chatdb?schema=public"
  RABBITMQ_URL="amqp://<user>:<password>@localhost:5672"
```

# Running for local development

```bash
npm run start:dev
```

# Running in docker

```bash
docker-compose up --build
```

# Testing

```bash
npm run test
npm run test:e2e
```
