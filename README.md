# Social App

A social media backend built with **Node.js, Express 5, TypeScript and MongoDB**. It has JWT authentication, user profiles with S3 image uploads, friend requests, posts and real-time private chat over **Socket.IO**. A small HTML/jQuery client is included for trying out login and chat.

> Built as a practice project while studying backend development.

## Tech Stack

| Area            | Tools                                                     |
| --------------- | --------------------------------------------------------- |
| Runtime / API   | Node.js, Express 5, TypeScript                            |
| Database        | MongoDB, Mongoose, mongoose-paginate-v2                   |
| Auth & security | JWT (access + refresh), bcrypt, AES-256 encryption, Google OAuth |
| Real-time       | Socket.IO                                                 |
| Validation      | Zod                                                       |
| File storage    | AWS S3 (pre-signed URLs), Multer                          |
| Testing         | Jest, Supertest, mongodb-memory-server, GitHub Actions     |
| Other           | Nodemailer (OTP emails), GraphQL (graphql-http), Morgan   |

## Features

- **Authentication**: sign up and confirm the email with an OTP (with resend), sign in with email/password or **Google**, refresh tokens (single-use, rotated), sign out with token blacklisting, and forget/reset password with an OTP.
- **CORS**: only origins listed in `CORS_WHITELIST` are allowed, for both the REST API and Socket.IO.
- **Profiles**: view private and public profiles, update them, soft-delete an account.
- **Profile pictures**: uploaded to AWS S3 and served with renewable pre-signed URLs.
- **Friendships**: send, list and accept/reject friend requests; create group conversations.
- **Posts**: create (with up to 3 S3 attachments and friend tags), update, delete, get by id, a user's posts, and a paginated home feed.
- **Comments**: comment on posts and reply to comments (one level), edit, delete (by the comment owner or the post owner), and list.
- **Reactions**: LIKE / LOVE / HAHA / SAD / ANGRY on posts and comments, with one react per user that can be changed or removed, and a count per type.
- **Cleanup**: deleting a post also deletes its comments, replies, reactions and S3 files.
- **Real-time chat**: authenticated Socket.IO connections, private messages and chat history, with multiple tabs per user supported.
- **GraphQL**: an experimental `/graphql` endpoint (authenticated `listUsers` query).

## Architecture

```
BE/src
├── app.ts           # Express app (routes, CORS, error handler)
├── index.ts         # starts the server, DB and Socket.IO
├── Common/          # enums, interfaces, constants, email templates
├── DB/
│   ├── Models/      # Mongoose schemas
│   └── Repositories/# generic BaseRepository + per-model repositories
├── Gateways/        # Socket.IO server + socket authentication
├── GraphQl/         # schema, types, resolvers
├── Middlewares/     # authentication, validation (Zod), multer
├── Modules/         # feature modules: controllers (routes) + services
├── Utils/           # encryption, tokens, errors, responses, S3, email
└── Validators/      # Zod request schemas
BE/tests/            # Jest + Supertest API tests
FE/                  # plain HTML/jQuery client (login + chat)
```

Requests go through a **controller → service → repository** chain. Errors are thrown as typed `HttpException`s and handled by one global error middleware.

## API Overview

Base URL: `http://localhost:5000/api`

| Method | Endpoint                             | Auth | Description                    |
| ------ | ------------------------------------ | :--: | ------------------------------ |
| POST   | `/auth/signup`                       |      | Register (sends OTP email)     |
| POST   | `/auth/signin`                       |      | Get access + refresh tokens    |
| POST   | `/auth/signout`                      |  ✓   | Blacklist the current token    |
| POST   | `/auth/confirm-email`                |      | Confirm email with the OTP     |
| POST   | `/auth/refresh-token`                |      | Get new tokens (refresh token in body) |
| POST   | `/auth/forget-password`              |      | Send a reset password OTP      |
| POST   | `/auth/reset-password`               |      | Reset password with the OTP    |
| POST   | `/auth/resend-confirmation`          |      | Resend the confirmation OTP    |
| POST   | `/auth/google`                       |      | Sign in with a Google `idToken` |
| GET    | `/profile`                           |  ✓   | Get own profile                |
| GET    | `/profile/public/:userId`            |  ✓   | Get a user's public profile    |
| PUT    | `/profile/update`                    |  ✓   | Update profile                 |
| DELETE | `/profile/delete-account`            |  ✓   | Soft-delete account            |
| POST   | `/profile/upload-profile-picture`    |  ✓   | Upload picture to S3           |
| GET    | `/profile/get-profile-picture`       |  ✓   | Get picture signed URL         |
| POST   | `/profile/renew-signed-url`          |  ✓   | Renew an expired signed URL    |
| POST   | `/profile/send-friend-request`       |  ✓   | Send friend request            |
| GET    | `/profile/friend-requests`           |  ✓   | List friend requests           |
| POST   | `/profile/respond-friend-request`    |  ✓   | Accept / reject a request      |
| POST   | `/profile/create-group`              |  ✓   | Create a group conversation    |
| POST   | `/posts/add`                         |  ✓   | Create a post                  |
| GET    | `/posts/home?page=1&limit=10`        |  ✓   | Paginated feed (newest first)  |
| GET    | `/posts/:postId`                     |  ✓   | Get a post                     |
| GET    | `/posts/user/:userId?page=1&limit=10`|  ✓   | A user's posts                 |
| PUT    | `/posts/update/:postId`              |  ✓   | Update own post                |
| DELETE | `/posts/delete/:postId`              |  ✓   | Delete own post                |
| POST   | `/comments/add`                      |  ✓   | Comment on a post or reply to a comment |
| PUT    | `/comments/update/:commentId`        |  ✓   | Edit own comment               |
| DELETE | `/comments/delete/:commentId`        |  ✓   | Delete a comment and its replies |
| GET    | `/comments/post/:postId`             |  ✓   | List a post's comments         |
| GET    | `/comments/:commentId/replies`       |  ✓   | List a comment's replies       |
| POST   | `/reacts/react`                      |  ✓   | Add or change a reaction       |
| DELETE | `/reacts/remove/:refId`              |  ✓   | Remove own reaction            |
| GET    | `/reacts/:refId`                     |  ✓   | List reactions with counts     |

Authenticated routes expect the header `Authorization: Bearer <accessToken>`.

**Socket.IO events**: connect with `auth: { authorization: <accessToken> }`, then use `send-private-message` / `get-chat-history`. The server answers with `message-sent` / `chat-history`.

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)
- An AWS S3 bucket and a Gmail app password, if you want uploads and OTP emails to work

### Backend

```bash
cd BE
npm install
cp .env.example .env   # then fill in your own values
npm run dev            # compiles TypeScript and starts with nodemon on :5000
```

For a production-style run: `npm run build && npm start`.

### Tests

```bash
cd BE
npm test
```

The tests use Jest and Supertest against an in-memory MongoDB (mongodb-memory-server), so they don't need a database or a `.env` file. Google token checks are mocked, and OTPs are read from the email event instead of being sent. The first run downloads a MongoDB binary. GitHub Actions runs the same tests on every push and pull request.

### Frontend

```bash
cd FE
npm install
```

Then open `FE/index.html` with a static server, for example the VS Code **Live Server** extension on port 5500. Make sure that origin is allowed by your CORS settings.

## Roadmap

- [x] Comments and reactions
- [x] Refresh-token endpoint
- [x] Email confirmation and forget/reset password
- [x] Google OAuth sign-in
- [x] Restrict CORS to `CORS_WHITELIST`
- [x] Automated tests

## License

MIT
