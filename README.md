# octg-inventory-agent

AI Agent for OCTG (Oil Country Tubular Goods) inventory.

## Project Structure

```
octg-inventory-agent/
├── server/              # Backend (Node.js + TypeScript)
│   ├── src/
│   │   └── index.ts     # Server entry point
│   ├── eslint.config.mts
│   ├── tsconfig.json
│   └── package.json
├── web/                 # Frontend (coming in Sprint 2)
├── .env.example         # Template for environment variables
└── README.md
```

> **Note:** The frontend will live in the `/web` folder starting in Sprint 2.

## Prerequisites

- [Node.js](https://nodejs.org/) v20 or later (developed on v20.18)
- npm (included with Node.js)

## Setup

1. **Clone the repository**

   ```bash
   git clone <repo-url>
   cd octg-inventory-agent
   ```

2. **Create your environment file**

   Copy the example file and fill in the values:

   ```bash
   cp .env.example .env
   ```

   `.env` files are git-ignored. Never commit real secrets; add new variables to `.env.example` (with placeholder values) so others know what's required.

3. **Install server dependencies**

   ```bash
   cd server
   npm install
   ```

## Running the Server

All commands below are run from the `server/` directory.

### Development

Runs the server with [tsx](https://tsx.is/) in watch mode, restarting automatically when files in `src/` change:

```bash
npm run dev
```

### Production

Compile the TypeScript to JavaScript in `server/dist/`, then run the compiled output:

```bash
npm run build
npm start
```

## Available Scripts

| Command            | Description                                        |
| ------------------ | -------------------------------------------------- |
| `npm run dev`      | Start the server in watch mode with `tsx`          |
| `npm run build`    | Compile TypeScript (`src/`) to JavaScript (`dist/`) |
| `npm start`        | Run the compiled server from `dist/index.js`       |
| `npm run lint`     | Check code with ESLint                             |
| `npm run lint:fix` | Check code with ESLint and auto-fix what it can    |

## Tech Stack

**Server (Back-End)**

- TypeScript 6 (strict mode, `NodeNext` modules, ES2022 target)
- tsx for running TypeScript directly during development
- ESLint 9 (flat config) with `typescript-eslint` recommended rules

**Web (Front-End)**

- Coming in Sprint 2
