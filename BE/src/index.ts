import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as controllers from './Modules/controllers.barrel';
import { dbConnection } from './DB/db.connection';
import { FailedResponse, HttpException } from './Utils/utils.barrel';
import { ioInitializer } from './Gateways/socketIo.gateway';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { createHandler } from 'graphql-http/lib/use/express';
import { MainSchema } from './GraphQl/main.grapql';

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const app = express();

app.use(cors());
app.use(express.json());

app.all('/graphql', createHandler({ schema: MainSchema, context: (req) => ({ authorization: req.raw.headers.authorization }) }));
app.use(morgan('combined', { stream: fs.createWriteStream(path.join(logsDir, 'combined.log'), { flags: 'a' }) }));

dbConnection();

app.use('/api/auth', controllers.authController);
app.use('/api/profile', controllers.profileController);
app.use('/api/posts', controllers.postController);
app.use('/api/comments', controllers.commentController);
app.use('/api/reacts', controllers.reactController);

// Error Handling Middleware
app.use((err: HttpException | Error | null, req: Request, res: Response, next: NextFunction) => {
  if (err) {
    if (err instanceof HttpException) {
      return res.status(err.statusCode).json(FailedResponse(err.message, err.statusCode, err.error));
    }
  }
  console.log(err?.stack);
  return res.status(500).json(FailedResponse('Internal Server Error', 500));
});

const port: number | string = process.env.PORT || 5000;
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

ioInitializer(server);
