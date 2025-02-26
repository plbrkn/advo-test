
FROM node:22.14.0-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY prisma ./prisma

RUN npx prisma generate

COPY . .

RUN npm run build

FROM node:22.14.0-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist

COPY --from=builder /app/prisma ./prisma

COPY package*.json ./

RUN npm ci --omit=dev

EXPOSE 3000 80

CMD ["npm", "run", "start:prod"]

