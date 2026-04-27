FROM node:20-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY . .

RUN pnpm install --frozen-lockfile

RUN pnpm --filter @workspace/api-server build

EXPOSE 3001

CMD ["pnpm", "--filter", "@workspace/api-server", "start"]
