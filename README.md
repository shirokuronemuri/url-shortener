# url-shortener

## Description

Url shortener API built with NestJS, Zod and Prisma. 

[Check out the docs](http://url.nemunemu.dev/docs) for details or build the project locally.
Test coverage and automatic deployment is included. Right now API tokens are handed out manually, please email me if you want to get one.

Also check out the [wiki](https://github.com/shirokuronemuri/url-shortener/wiki/Todo) page for future development plans.

## Dev setup

Create `.env` file based on `.env.example`, then:

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

1. Create `.env.production` file based on `.env.example`
2. Change the dockerhub image name in `docker-compose.prod.yml` if needed

4. choose one of two:

- if deploying manually, run the following commands (you need to be logged into dockerhub): 

  ```bash
  # (windows env variable syntax is also supported)
  $ DOCKERNAME_USERNAME=yourusername APP_NAME=url-shortener pnpm d:build:prod
  $ DOCKERNAME_USERNAME=yourusername APP_NAME=url-shortener pnpm d:push:prod
  ```

  Then copy .env.production, package.json and docker-compose.prod.yml to your server and run the containers:

  ```bash
  $ pnpm d:up:prod
  ```

- if using github actions for build, modify deploy.yml for your needs, set the required repository secrets and run the workflow

5. 

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
