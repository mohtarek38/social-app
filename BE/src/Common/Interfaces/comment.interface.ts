import { Document, Types } from 'mongoose';

export interface IComment extends Document {
  content: string;
  attachments?: string;
  ownerId: Types.ObjectId;
  refId: Types.ObjectId;
  onModel: string; // 'Post' or 'Comment'
}
