# nest-starter

## Description

[Nest](https://github.com/nestjs/nest) framework starter project. It includes test coverage, some middlewares, request body validation with zod, logging, prisma + postgres, redis caching and github actions for automated testing and deployment to a remote server.

## Dev setup

create `.env` and `.env.test` files based on `.env.example`, then:

```bash
$ pnpm install

# Run required docker containers
$ pnpm d:up

# apply migrations and generate prisma client
$ pnpm db:m:dev

# run the project
$ pnpm start:dev
```

## Production setup

create `.env.production` file based on `.env.example`, then:

```bash
# build the app image and upload it to docker hub (you need to login with the username you specified in .env.production)
$ pnpm d:build:prod
$ docker tag nest-starter:latest [yourusername]/nest-starter:latest

# then copy .env.production, package.json and docker-compose.prod.yml to your server and run the containers
$ pnpm d:up:prod
```

To stop production server run: 

```bash
$ pnpm d:down:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

```

## API

Swagger docs for the server are available at the `/docs` route.
