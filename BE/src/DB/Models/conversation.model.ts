import mongoose, { Types } from 'mongoose';
import { IConversation } from '../../Common/Interfaces/interface.barrel';

const conversationSchema = new mongoose.Schema({
  type: {
    type: String,
    default: 'direct',
    enum: ['direct', 'group'],
  },
  name: String,
  members: [{ type: Types.ObjectId, ref: 'User' }],
});

export const conversationModel = mongoose.model<IConversation>('Conversation', conversationSchema);