import { Socket } from 'socket.io';
import { ChatService } from './Services/chat.service';

export class ChatEvents {
  private chatService: ChatService = new ChatService();
  constructor(private socket: Socket) {}

  sendPrivateMessageEvent() {
    this.socket.on('send-private-message', (data) => {
      this.chatService.sendPrivateMessage(this.socket, data);
    });
  }
  getConversationHistoryEvent() {
    this.socket.on('get-chat-history', (data) => {
      this.chatService.getChatHistory(this.socket, data);
    });
  }
}

