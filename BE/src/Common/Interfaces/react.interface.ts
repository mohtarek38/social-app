import { Document, Types } from 'mongoose';
import { ReactTypeEnum } from '../common.barrel';

export interface IReact extends Document {
  ownerId: Types.ObjectId;
  refId: Types.ObjectId;
  onModel: string; // 'Post' or 'Comment'
  type: ReactTypeEnum;
}
