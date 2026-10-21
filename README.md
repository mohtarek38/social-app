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
| Other           | Nodemailer (OTP emails), GraphQL (graphql-http), Morgan   |

## Features

- **Authentication**: sign up with an email OTP, sign in, and sign out with token blacklisting.
- **Profiles**: view private and public profiles, update them, soft-delete an account.
- **Profile pictures**: uploaded to AWS S3 and served with renewable pre-signed URLs.
- **Friendships**: send, list and accept/reject friend requests; create group conversations.
- **Posts**: create posts and get a paginated home feed.
- **Real-time chat**: authenticated Socket.IO connections, private messages and chat history, with multiple tabs per user supported.
- **GraphQL**: an experimental `/graphql` endpoint (authenticated `listUsers` query).

## Architecture

```
BE/src
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
| GET    | `/posts/home?page=1&limit=10`        |  ✓   | Paginated feed                 |

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

### Frontend

```bash
cd FE
npm install
```

Then open `FE/index.html` with a static server, for example the VS Code **Live Server** extension on port 5500. Make sure that origin is allowed by your CORS settings.

## Roadmap

- [ ] Comments and reactions (routes are scaffolded in `Modules/Comments` and `Modules/Reacts`)
- [ ] Refresh-token endpoint
- [ ] Restrict CORS to `CORS_WHITELIST`
- [ ] Automated tests

## License

MIT
