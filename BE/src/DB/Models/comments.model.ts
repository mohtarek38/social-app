import mongoose from 'mongoose';
import { IComment } from '../../Common/Interfaces/interface.barrel';

const commentSchema = new mongoose.Schema<IComment>(
  {
    content: String,
    attachments: String,
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    refId: { type: mongoose.Schema.Types.ObjectId, refPath: 'onModel', required: true },
    onModel: { type: String, enum: ['Post', 'Comment'] },
  },
  { timestamps: true },
);

export const CommentModel = mongoose.model<IComment>('Comment', commentSchema);
