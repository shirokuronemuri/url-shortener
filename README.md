# url-shortener

## Description

Url shortener API built with NestJS, Zod and Prisma. 

[Check out the docs](http://url.nemunemu.dev/docs) for details or build the project locally.
Test coverage and automatic deployment is included. Right now API tokens are handed out manually, please email me if you want to get one.

Also check out the [wiki](https://github.com/shirokuronemuri/url-shortener/wiki/Todo) page for future development plans.

## Dev setup

create `.env` file based on `.env.example`, then:

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

Create `.env.production` file based on `.env.example`, then:

```bash
# build the app image and upload it to docker hub (you need to login with the username you specified in .env.production)
$ pnpm d:build:prod
$ docker tag url-shortener:latest [yourusername]/url-shortener:latest

# then copy .env.production, package.json and docker-compose.prod.yml to your server and run the containers
$ pnpm d:up:prod
```

To stop production server run: 

```bash
$ pnpm d:down:prod
```

## Run tests

Create `.env.test` file based on `.env.example`, then:

```bash
# run test containers
$ pnpm d:up:test

# apply database migrations
$ pnpm db:m:test

# run unit tests
$ pnpm test

# run e2e and integration tests
$ pnpm test:e2e
```

## API

Swagger docs for the server are available at the `/docs` route.
