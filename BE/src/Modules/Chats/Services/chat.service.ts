import { Socket } from 'socket.io';
import { ConversationRepository, MessageRepository } from '../../../DB/Repositories/repository.barrel';
import { getIo } from '../../../Gateways/socketIo.gateway';

export class ChatService {
  private conversationRepository: ConversationRepository = new ConversationRepository();
  private messageRepository: MessageRepository = new MessageRepository();

  async joinPrivateRoom(socket: Socket, targetUserId: string) {
    let conversation = await this.conversationRepository.findOneDocument({
      type: 'direct',
      members: { $all: [socket.data.userId, targetUserId] },
    });
    if (!conversation) {
      conversation = await this.conversationRepository.createNewDocument({
        type: 'direct',
        members: [socket.data.userId, targetUserId],
      });
    }
    socket.join(conversation._id.toString());
    return conversation;
  }

  async sendPrivateMessage(socket: Socket, data: unknown) {
    const { targetUserId, text } = data as { targetUserId: string; text: string };
    const conversation = await this.joinPrivateRoom(socket, targetUserId);
    // create Message
    const newMessage = await this.messageRepository.createNewDocument({
      text,
      conversationId: conversation._id,
      senderId: socket.data.userId,
    });
    getIo()?.to(conversation._id.toString()).emit('message-sent', newMessage);
  }

  async getChatHistory(socket: Socket, targetUserId: string) {
    const conversation = await this.joinPrivateRoom(socket, targetUserId);
    const messages = await this.messageRepository.findDocuments({ conversationId: conversation._id });
    socket.emit('chat-history', messages);
  }
}
