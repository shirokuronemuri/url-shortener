FROM node:24-alpine

RUN corepack enable

WORKDIR /app

ENV DATABASE_URL="postgresql://user:pass@localhost:5432/fakedb"

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

CMD ["pnpm", "start:prod"]
