# Squirrels Studio

This project is the source code for Squirrels Studio. It is built using NodeJS, Typescript, Vite, and React.

## License

Squirrels Studio is released under the Apache License 2.0.

See the file LICENSE for more details.

## Contributing 

The sections below decribe how to set up your local environment for development of this project.

### Setup

Install NodeJS v24.12.0 or higher. Then run `pnpm install` on this project.

Run `pnpm dev` in this project to activate the client. This will start Squirrels Studio at http://localhost:5173/.

For testing, we recommend using an existing Squirrels project, and run its API server (by running "sqrl run" in the project). 

In the Squirrels project, add "http://localhost:5173" to the environment variable "SQRL_AUTH__ALLOWED_ORIGINS_FOR_COOKIES". This environment variable is a comma-separated list of domains that can use cookies for authentication.

Then, in Squirrels Studio (at http://localhost:5173/), enter the host domain and mounted path of the Squirrels project, and click "Connect". This will navigate to the login page.
