import mongoose from 'mongoose';
import { IMessage } from '../../Common/Interfaces/interface.barrel';

const messagesSchema = new mongoose.Schema({
  text: String,
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
  },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  attachments: [String],
});

export const messagesModel = mongoose.model<IMessage>('Message', messagesSchema);
