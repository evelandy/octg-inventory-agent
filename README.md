# octg-inventory-agent

AI Agent for OCTG (Oil Country Tubular Goods) inventory.

## Project Structure

```
octg-inventory-agent/
├── server/                    # Backend (Node.js + TypeScript)
│   ├── src/
│   │   ├── index.ts           # Server entry point
│   │   ├── config/
│   │   │   └── database.cjs   # sequelize-cli connection config
│   │   ├── db/
│   │   │   ├── connection.ts  # Shared Sequelize connection for the app
│   │   │   ├── migrations/    # Schema migrations (.cjs)
│   │   │   └── seeders/
│   │   └── scripts/
│   │       └── ping.ts        # Database connection check
│   ├── .sequelizerc           # Tells sequelize-cli where config and migrations live
│   ├── eslint.config.mts
│   ├── tsconfig.json
│   └── package.json
├── web/                       # Frontend (coming in Sprint 2)
├── docs/
│   └── schema.md              # Database schema, ERD and design decisions
├── docker-compose.yml         # PostgreSQL 16 for local development
├── .env.example               # Template for environment variables
└── README.md
```

> **Note:** The frontend will live in the `/web` folder starting in Sprint 2.

## Prerequisites

- [Node.js](https://nodejs.org/) v20 or later (developed on v20.18)
- npm (included with Node.js)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (runs PostgreSQL)

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

   Replace `CHANGE_ME` with a password of your choice. It appears **twice**, in `POSTGRES_PASSWORD` and inside `DATABASE_URL`, and both must match.

3. **Start the database**

   ```bash
   docker compose up -d --wait
   ```

   `--wait` returns once Postgres passes its health check and is ready for connections.

4. **Install server dependencies**

   ```bash
   cd server
   npm install
   ```

5. **Apply the schema and check the connection**

   ```bash
   npm run migrate
   npm run db:ping
   ```

   `npm run migrate` builds the whole schema on an empty database. `db:ping` should print `✅ Connected to Postgres`.

## Database

PostgreSQL 16 runs in Docker as the `octg-inventory-db` container. Data persists in the `octg_pgdata` volume between restarts. See [docs/schema.md](docs/schema.md) for the schema, ERD and design decisions.

- **Port 5433.** The container is published on `localhost:5433`, not the default 5432, so it doesn't conflict with other local Postgres instances.
- **Connect with psql:** `docker compose exec db psql -U octg -d octg_inventory`
- **Stop / start:** `docker compose stop` / `docker compose up -d --wait`
- **Reset to empty:** `docker compose down -v` deletes the volume and all data. Run this after changing the `POSTGRES_*` values in `.env`, because Postgres only reads them the first time it starts with an empty volume. Then start the database and run `npm run migrate` again.

### Migrations

Migrations live in `server/src/db/migrations/` and run in filename (timestamp) order. Create one with `npm run migrate:make <name>`, then rename the generated `.js` file to `.cjs` (the package uses ES modules, and `sequelize-cli` needs CommonJS). Never edit a migration that has already been pushed; add a new one instead.

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

Run from the `server/` directory.

| Command                     | Description                                         |
| --------------------------- | --------------------------------------------------- |
| `npm run dev`               | Start the server in watch mode with `tsx`           |
| `npm run build`             | Compile TypeScript (`src/`) to JavaScript (`dist/`) |
| `npm start`                 | Run the compiled server from `dist/index.js`        |
| `npm run lint`              | Check code with ESLint                              |
| `npm run lint:fix`          | Check code with ESLint and auto-fix what it can     |
| `npm run db:ping`           | Check that the server can connect to Postgres       |
| `npm run migrate`           | Apply all pending migrations                        |
| `npm run migrate:status`    | List migrations and whether each has been applied   |
| `npm run migrate:undo`      | Revert the most recent migration                    |
| `npm run migrate:undo:all`  | Revert all migrations                               |
| `npm run migrate:make <name>` | Generate a new migration file                     |

## Tech Stack

**Server (Back-End)**

- TypeScript 6 (strict mode, `NodeNext` modules, ES2022 target)
- tsx for running TypeScript directly during development
- ESLint 9 (flat config) with `typescript-eslint` recommended rules
- PostgreSQL 16 (Docker)
- Sequelize 6 with `sequelize-cli` for migrations

**Web (Front-End)**

- Coming in Sprint 2
