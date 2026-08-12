# My Programming Journey Backend

Backend API server for the "My Programming Journey" blog platform. Provides public endpoints for reading posts, categories, and tags, as well as authenticated CMS endpoints for content management and image uploads via Google Drive.

- [Frontend](https://github.com/CarmenChanCKY/my-programming-journey)
- [CMS](https://github.com/CarmenChanCKY/my-programming-journey-cms)

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express 5
- **Database**: MySQL 8.0 with mysql2 driver
- **Migrations**: Sequelize CLI
- **Authentication**: Better Auth (email/password, session-based)
- **Image Storage**: Google Drive API (via OAuth 2.0)
- **Security**: Helmet, CORS, express-rate-limit
- **Logging**: Winston
- **Build**: Webpack with ts-loader
- **Containerization**: Docker Compose

## Getting Started

### Prerequisites

- Node.js 22+
- MySQL 8.0+ (or use Docker)
- Google Cloud project with Drive API enabled (for image uploads)

### Install Dependencies

```
npm install
```

### Environment Variables

This project uses environment variable files stored in `config/env/`. Create `.env.development` and `.env.production` files for each environment. See [.env.example](config/env/.env.example) for the full template.

| Variable | Default | Description |
|---|---|---|
| `PORT` | 3000 | Express server port |
| `NODE_ENV` | — | `development` or `production` |
| `FRONTEND_PATH` | `http://localhost:5173` | Allowed CORS origin for public frontend |
| `CMS_PATH` | `http://localhost:3000` | Allowed CORS origin for CMS frontend |
| `DB_HOST` | localhost | MySQL host |
| `DB_PORT` | 3306 | MySQL port |
| `DB_USERNAME` | root | MySQL username |
| `DB_PASSWORD` | — | MySQL password |
| `DB_DATABASE` | — | MySQL database name |
| `MYSQL_ROOT_PASSWORD` | — | MySQL root password (Docker) |
| `BETTER_AUTH_SECRET` | — | Better Auth encryption secret (32+ chars, generate with `openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | `http://localhost:3100` | Better Auth base URL matching the backend |
| `API_BASE_PATH` | `/token-admin` | Better Auth API base path |
| `GOOGLE_API_CLIENT_ID` | — | Google OAuth client ID (Drive API) |
| `GOOGLE_API_CLIENT_SECRET` | — | Google OAuth client secret |
| `GOOGLE_API_REDIRECT_URLS` | — | Google OAuth redirect URI |
| `GOOGLE_API_REDIRECT_PATHNAME` | — | OAuth callback route path |
| `GOOGLE_API_DESTINATION_FOLDER_ID` | — | Google Drive folder ID for image uploads |
| `CRYPTO_ENCRYPTION_KEY` | — | AES-256-GCM key for encrypting OAuth tokens at rest |
| `CMS_LOGIN_EMAIL` | `admin@example.com` | Admin account email (one-time setup script) |
| `CMS_LOGIN_PW` | `change-me-please` | Admin account password (one-time setup script) |

### Start Development Server

```
npm run start:dev
```

### Build for Production

```
npm run build
```

## Authentication (Better Auth)

This project uses [Better Auth](https://better-auth.com) for authentication.

### Configuration

Auth config is located in `src/middleware/auth/auth.ts`:
- **Database**: Uses the existing `mysql2/promise` connection pool directly
- **Base path**: `/token-admin` (all auth endpoints)
- **Sign-in**: Email & password only, sign-up is **disabled** by default (admin accounts are created via a one-time script)
- **Trusted origins**: CMS frontend and public frontend URLs
- **Rate limiting**: Better Auth built-in rate limiting enabled (applies to auth endpoints like sign-in)
- **Session**: 7-day expiry, 24-hour update age, JWE-encrypted cookie cache

### Running Migrations

Better Auth creates its own `user`, `session`, `account`, and `verification` tables. Run the migration inside the Docker container:

```
docker compose exec mpj_backend npx auth migrate --config src/middleware/auth/auth.ts
```

Then restart the backend:
```
docker compose restart mpj_backend
```

### Creating an Admin Account

Run the one-time script `scripts/create-admin.ts`:

```
docker compose exec mpj_backend npx tsx scripts/create-admin.ts
```

This uses `CMS_LOGIN_EMAIL` and `CMS_LOGIN_PW` from environment variables. Temporarily set `disableSignUp: false` in `auth.ts` before running, then re-enable it.

### Auth Middleware

All CMS routes (`/cms/*`) are protected by the `requireAuth` middleware at `src/middleware/auth/require_auth.ts`. It returns 401 if no valid session cookie is present.

## Google OAuth (Drive Integration)

This is **not** for user login -- it integrates with the **Google Drive API** to upload and manage blog images.

- **Config files**: `src/modules/google_oauth/oauth.ts`, `oauth_db.ts`
- **Scope**: `https://www.googleapis.com/auth/drive.file`
- **Token storage**: Refresh and access tokens are encrypted with AES-256-GCM and stored in the `google_oauth_tokens` MySQL table
- **Re-auth flow**: If tokens expire or are revoked, the API returns a `reauthUrl` to the CMS frontend for re-authorization

## Docker

Docker Compose ([docker-compose.yml](docker-compose.yml)) sets up two services:

| Service | Image | Description |
|---|---|---|
| `mpj_db` | [mysql:8.0.39](https://hub.docker.com/_/mysql) | MySQL database |
| `mpj_backend` | [node:22](https://hub.docker.com/_/node) | Express backend |

Database initialization scripts:
- **Local**: [init_db_local.sql](docker/db/init_db_local.sql) -- used by Docker Compose
- **AWS**: [init_db_aws.sql](docker/db/init_db_aws.sql) -- for AWS deployments

### Build and Run

```
docker-compose up -d
```

### Stop

```
docker-compose stop
```

### Remove Containers and Images

```
docker-compose down
```

## Database

### Connection

MySQL connection pool is configured in [config/database/connect.ts](config/database/connect.ts) using the [mysql2](https://www.npmjs.com/package/mysql2) driver. See the [mysql2 documentation](https://sidorares.github.io/node-mysql2/docs#first-query) for details.

### Migrations (Sequelize CLI)

Sequelize CLI config is at [config/config.js](config/config.js). See the [Sequelize migration docs](https://sequelize.org/docs/v6/other-topics/migrations/) for reference.

```bash
# Create a new model
npx sequelize-cli model:generate --name [table_name] --attributes [col]:[type],[col]:[type]

# Create a new migration
npx sequelize-cli migration:generate --name [name]

# Run all pending migrations
npx sequelize-cli db:migrate

# Run migrations up to a specific file
npx sequelize-cli db:migrate --to [migration_file]

# Undo last migration
npx sequelize-cli db:migrate:undo

# View migration status
npx sequelize-cli db:migrate:status
```
