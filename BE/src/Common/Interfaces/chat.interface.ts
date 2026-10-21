import { Document, Types } from "mongoose";

interface IConversation extends Document {
  type: 'direct' | 'group';
  members: Types.ObjectId[];
  name?: string;
}

interface IMessage extends Document {
  text: string;
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  attachments?: string[];
}

export { IConversation, IMessage };