## Tech Stack

- **Express.js**: Web framework for building REST APIs.
- **Drizzle**: An ORM (Object-Relational Mapping) tool that simplifies interactions with the PostgreSQL database.
- **Google Cloud Storage**: Used for storing profile pictures and chat images.
- **Firebase Realtime Database**: Real-time database for managing user interactions between learners and tutors.

## Environment Variables

The application requires the following environment variables to be set:

- `DATABASE_URL`: PostgreSQL database connection URL.
- `FIREBASE_SERVICE_ACCOUNT_KEY`: JSON string containing the Firebase service account key.
- `FIREBASE_DATABASE_URL`: URL of the Firebase Realtime Database.
- `GCS_BUCKET_NAME`: Google Cloud Storage bucket name for storing images.
- `GOOGLE_OAUTH_CLIENT_ID`: Google OAuth client ID for authenticating users.
- `JWT_SECRET`: Secret key for signing JWT tokens used for authentication.

Optionally, you can set the following environment variables:

- `PORT`: Port number for the Express.js server. Default is 8080.
- `GROQ_KEY`: API key for Groq, used to generate teaching methodologies for tutors. Only necessary if you are running the seeders.

See [Development Guide](docs/development-guide.md) and [Common Issues](docs/common-issues.md) for more information.
