# Discord Quote Platform

A platform for uploading custom sound clips to play in your Discord server.

## Contributing

This repository consists of frontend, backend and a Discord bot, all managed as a single SvelteKit project.

Apart from [pnpm](https://pnpm.io/), you also need to have the CLI tool [ffmpeg](https://ffmpeg.org/) installed on your machine and on your `$PATH`.

### Setup

First, duplicate the `.env.example` file and rename it to `.env` - all properties from the example have to be filled out for the application to run.

Then, get started by installing the dependencies with `pnpm` and setting up the SQLite database:

```sh
pnpm install
pnpm db:push
```

### Development

As with most Vite powered projects, the development server can be started with the following:

```sh
# Start the frontend, backend and Discord client.
pnpm dev

# Optionally, open the served website in your browser.
pnpm dev --open
```

### Building

The project can be compiled into an optimized Node.js server by running the following command:

```sh
pnpm build
```

The built server can then be run with the `node` command:

```sh
node --env-file=.env ./build
```

You can [specify environment variables](https://svelte.dev/docs/kit/adapter-node#Environment-variables) to configure a custom port and other server settings.
