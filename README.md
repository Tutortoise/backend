# Tutortoise (Backend)

This project is a RESTful API built with **Express.js**, providing a platform for
learners and tutors to interact, manage orders, reviews, and more.

You can view the API documentation [here](https://tutortoise.github.io/backend/api/).

## Tech Stack

- **Express.js**: Web framework for building REST APIs.
- **Drizzle**: An ORM (Object-Relational Mapping) tool that simplifies interactions with the PostgreSQL database.
- **Google Cloud Storage**: Used for storing profile pictures and chat images.
- **Firebase Realtime Database**: Real-time database for managing user interactions between learners and tutors.
- **Vitest & SuperTest**: Testing frameworks for integration tests.

## Project Structure

The project is structured in a modular way to ensure maintainability and
scalability. Each module encapsulates specific functionality and follows the
principle of separation of concerns. Below is an overview of the key
directories and files:

- `src/`: Contains the source code for the application.

  - `common/`: Common services and utilities used across the application.
  - `db/`: Database configuration and drizzle setup.
  - `helpers/`: Helper functions for the application.
  - `middleware/`: Express middlewares (Logging, Validation, etc.).
  - `modules/`: Contains the modules for the application. Each module is a separate directory containing the following:

    - `abusive-detection/`: Integrates with API for detecting abusive content.
    - `auth/`: andles authentication (login, signup) and authorization (role-based access control).
    - `category/`: Category related logic (popular categories, etc.).
    - `chat/`: Manages chat-related functionality, including messages, and media.
    - `face-validation/`: Integrates with API for face validation
    - `learner/`: Manages learner (user/student) profiles and interactions.
    - `notification/`: Notification related logic.
    - `order/`: Manages order (reservation) creation, updates, rejection, and completion.
    - `recommendation/`: Integrates with API for generating recommendations.
    - `review/`: Manages reviews for tutors and lessons.
    - `tutor/`: Manages tutor (teacher) profiles and their availability.
    - `tutories/`: Manage tutories (lesson) creation, deletion, and updates

  - `routes/`: Express route definitions.
  - `swagger/`: Swagger API documentation.

## Environment Variables

The application requires the following environment variables to be set:

- `DATABASE_URL`: PostgreSQL database connection URL.
- `FIREBASE_SERVICE_ACCOUNT_KEY`: JSON string containing the Firebase service account key.
- `FIREBASE_DATABASE_URL`: URL of the Firebase Realtime Database.
- `GCS_BUCKET_NAME`: Google Cloud Storage bucket name for storing images.
- `GOOGLE_OAUTH_CLIENT_ID`: Google OAuth client ID for authenticating users.
- `JWT_SECRET`: Secret key for signing JWT tokens used for authentication.
- `FACE_VALIDATION_URL`: URL for the [face validation API](https://github.com/Tutortoise/face-validation-service).
- `ABUSIVE_DETECTION_URL`: URL for the [abusive detection API](https://github.com/Tutortoise/bilingual-abusive-detection-service)
- `RECOMMENDATION_URL`: URL for the [recommendation API](https://github.com/Tutortoise/system-recommender-service).

Optionally, you can set the following environment variables:

- `PORT`: Port number for the Express.js server. Default is 8080.
- `GROQ_KEY`: API key for Groq, used to generate teaching methodologies for tutors. Only necessary if you are running the seeders.

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

   # Google OAuth Client ID
   GOOGLE_OAUTH_CLIENT_ID=your-client-id

   # Google Cloud Storage
   GCS_BUCKET_NAME=your-bucket-name

   # JWT
   JWT_SECRET=your-jwt-secret

   # ML APIs
   FACE_VALIDATION_URL=
   ABUSIVE_DETECTION_URL=
   RECOMMENDATION_URL=

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

- Realtime Database emulator on port 9000
- Storage emulator on port 9199

## Starting the Development Server

```bash
bun dev
```

The server will be available at `http://localhost:8080`

## Common Issues

See [Common Issues](docs/common-issues.md) for solutions to common development problems.
