# Local Development Guide

This guide covers how to set up and run the project in your local development environment.

## Prerequisites

- Bun (v1.1.38)
- PostgreSQL (v16)
- Docker (optional, for running PostgreSQL in container)
- Firebase CLI
- Google Cloud SDK (for storage emulator)

## Environment Setup

1. Clone the repository
2. Install dependencies:

   ```bash
   bun install
   ```

3. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration:

   ```env
   # Server
   PORT=8080
   CORS_ORIGIN=*

   # Database
   DATABASE_URL=postgres://tutortoise:tutortoise@localhost:5432/tutortoise_test

   # Firebase
   FIREBASE_DATABASE_URL=http://localhost:9000
   FIREBASE_DATABASE_EMULATOR_HOST=localhost:9000
   FIREBASE_SERVICE_ACCOUNT_KEY={"type": "service_account", ...} # Your Firebase service account key

   # Google Cloud Storage
   GCS_BUCKET_NAME=your-bucket-name

   # JWT
   JWT_SECRET=your-jwt-secret

   # Optional: For AI-generated content in seeders
   GROQ_KEY=your-groq-api-key
   ```

## Database Setup

### Using Docker (Recommended)

1. Start the PostgreSQL container:

   ```bash
   docker compose -f docker-compose.local.yml up -d
   ```

2. Run database migrations:

   ```bash
   bun db:migrate
   ```

3. (Optional) Seed the database:
   ```bash
   bun db:seed
   ```

### Using Local PostgreSQL

1. Create a new database:

   ```sql
   CREATE DATABASE tutortoise_test;
   ```

2. Create a new user:

   ```sql
   CREATE USER tutortoise WITH PASSWORD 'tutortoise';
   GRANT ALL PRIVILEGES ON DATABASE tutortoise_test TO tutortoise;
   ```

3. Run database migrations:
   ```bash
   bun db:migrate
   ```

## Firebase Emulators

1. Install Firebase CLI if you haven't:

   ```bash
   npm install -g firebase-tools
   ```

2. Log in to Firebase:

   ```bash
   firebase login
   ```

3. Start the emulators:
   ```bash
   firebase emulators:start
   ```

This will start:

- Firebase Authentication emulator on port 9099
- Realtime Database emulator on port 9000
- Storage emulator on port 9199

## Starting the Development Server

```bash
bun dev
```

The server will be available at `http://localhost:8080`

## Common Issues

See [common-issues.md](./common-issues.md) for solutions to common development problems.
