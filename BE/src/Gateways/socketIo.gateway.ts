import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { corsOptions, verifyToken } from '../Utils/utils.barrel';
import { ChatInitiation } from '../Modules/Chats/chat';

export const connectedSockets = new Map<string, string[]>();
let io: Server | null = null;

function socketAuthentication(socket: Socket, next: Function) {
  try {
    const token = socket.handshake.auth.authorization;
    const decodedData = verifyToken(token, process.env.JWT_ACCESS_SECRET as string);
    socket.data = { userId: decodedData._id };

    const userTabs = connectedSockets.get(socket.data.userId);
    if (!userTabs) connectedSockets.set(socket.data.userId, [socket.id]);
    else userTabs.push(socket.id);

    socket.emit('connected', { user: { _id: socket.data.userId, firstName: decodedData.firstName, lastName: decodedData.lastName } });

    next();
  } catch (error) {
    next(error);
  }
}

function socketDisconnection(socket: Socket) {
  socket.on('disconnect', () => {
    console.log('A user disconnected');

    const userTabs = connectedSockets.get(socket.data?.userId);
    if (userTabs) {
      const updatedTabs = userTabs.filter((id) => id !== socket.id);
      if (updatedTabs.length > 0) connectedSockets.set(socket.data.userId, updatedTabs);
      else connectedSockets.delete(socket.data.userId);
    }

    socket.emit('disconnected', { user: { _id: socket.data?.userId } });
  });
}

export const ioInitializer = (server: HttpServer) => {
  io = new Server(server, { cors: corsOptions });

  io.use(socketAuthentication);

  io.on('connection', (socket: Socket) => {
    console.log('user connected on', socket.id);

    ChatInitiation(socket);
    socketDisconnection(socket);
  });
};

export const getIo = (): Server => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};
