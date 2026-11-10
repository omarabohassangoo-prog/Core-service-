FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bunx prisma generate --schema prisma/schema.prisma
RUN bun run build

ENV NODE_ENV=production
ENV PORT=10000
EXPOSE 10000

CMD ["bun", "run", "dev"]
