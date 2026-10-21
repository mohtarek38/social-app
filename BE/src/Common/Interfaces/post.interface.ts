import { Document, Types } from 'mongoose';

export interface IPost extends Document {
  description?: string;
  attachments?: string[];
  ownerId: Types.ObjectId;
  allowComments?: boolean;
  tags?: Types.ObjectId[];
}
