import mongoose from 'mongoose';
import { IReact } from '../../Common/Interfaces/interface.barrel';
import { ReactTypeEnum } from '../../Common/common.barrel';

const reactSchema = new mongoose.Schema<IReact>(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    refId: { type: mongoose.Schema.Types.ObjectId, refPath: 'onModel', required: true },
    onModel: { type: String, enum: ['Post', 'Comment'], required: true },
    type: { type: String, enum: ReactTypeEnum, required: true },
  },
  { timestamps: true },
);
// A user can only have one react on the same post/comment
reactSchema.index({ ownerId: 1, refId: 1 }, { unique: true });

export const ReactModel = mongoose.model<IReact>('React', reactSchema);
