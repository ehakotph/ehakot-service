# express-starter-template

A robust, production-ready Express.js boilerplate built with TypeScript and the Bun runtime. It provides a solid foundation for scalable REST APIs with built-in authentication, database ORM, real-time sockets, and email templating.

## Features

- **Runtime & Language**: Built on [Bun](https://bun.com) for speed, written in strict TypeScript.
- **Database**: PostgreSQL integration using [Sequelize](https://sequelize.org/) ORM.
- **Authentication**: Local and JWT strategies configured via [Passport.js](https://www.passportjs.org/).
- **Validation**: Type-safe environment and request body validation using [Zod](https://zod.dev/).
- **Security**: Pre-configured with Helmet (security headers), CORS, and Express Rate Limit.
- **Real-time**: Integrated [Socket.IO](https://socket.io/) setup.
- **Email System**: Nodemailer with Handlebars (`.hbs`) HTML templates.
- **Containerization**: Multi-stage Dockerfile for optimized production deployments.
- **Linting**: Pre-configured ESLint for code quality.

## Tech Stack

- **Framework**: Express.js (v5)
- **Runtime**: Bun (Node.js compatible)
- **Language**: TypeScript
- **Database**: PostgreSQL (pg), Sequelize ORM
- **Auth**: Passport.js (Local, JWT), jsonwebtoken, bcryptjs
- **Validation**: Zod
- **Real-time**: Socket.IO
- **Email**: Nodemailer, Handlebars
- **Code Quality**: ESLint

## Project Structure

```text
.
├── config/              # Environment variable validation (Zod)
├── src/
│   ├── controllers/     # Route handlers and business logic
│   ├── middlewares/     # Custom Express middlewares (e.g., auth, validation)
│   ├── models/          # Sequelize database models
│   ├── routes/          # API route definitions
│   ├── schemas/         # Zod schemas for request validation
│   ├── strategies/      # Passport.js authentication strategies
│   ├── templates/       # Handlebars templates for emails
│   └── utilities/       # Server setup, DB connection, helpers
├── Dockerfile           # Multi-stage Docker build config
├── package.json         # Project metadata and scripts
└── tsconfig.json        # TypeScript compiler configuration
```

## Setup & Installation

1. **Install dependencies:**
   This project was created using `bun init` and uses Bun as its package manager and runtime.
   ```bash
   bun install
   ```

2. **Configuration:**
   Copy the provided `.env.sample` to `.env` and fill in your values.
   ```bash
   cp .env.sample .env
   ```
   *Note: You must generate base64-encoded keys for `PRIVATE_ACCESS_KEY` and `PUBLIC_ACCESS_KEY` for JWT to work.*

## Usage

**Development Mode:**
Runs the app with file watching enabled.
```bash
bun run dev
```

**Production Build:**
Builds the TypeScript code into the `dist/` directory and runs it.
```bash
bun run build
bun run start
```
*(Alternatively, run `bun run index.ts` directly as previously supported.)*

**Using Docker:**
You can build and run the application using the included multi-stage Dockerfile.
```bash
docker build -t express-starter-template .
docker run -p 5001:5001 --env-file .env express-starter-template
```

## Vercel Deployment

This project is configured and ready for deployment on [Vercel](https://vercel.com). The `vercel.json` configuration and the `api/index.ts` entry point are set up to deploy the Express application as Vercel Serverless Functions.

To deploy locally using the Vercel CLI:
1. Install the Vercel CLI: `npm i -g vercel` (or use `bun install -g vercel`)
2. Run `vercel` in the root directory to log in and create a preview deployment.
3. For production deployment, run `vercel --prod`.

*Note: Remember to configure your environment variables (like `DATABASE_URL`, `JWT_SECRET`, etc.) in the Vercel project settings dashboard before deploying.*

## Linting

To run the ESLint checks:
```bash
bun run lint
```
To automatically fix linting errors:
```bash
bun run lint:fix
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
