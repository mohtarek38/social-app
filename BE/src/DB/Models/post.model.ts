import mongoose, { PaginateModel } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import { IPost } from '../../Common/Interfaces/interface.barrel';

const postSchema = new mongoose.Schema<IPost>(
  {
    description: String,
    attachments: [String],
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    allowComments: { type: Boolean, default: true },
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true },
);
postSchema.plugin(mongoosePaginate);
export const PostModel = mongoose.model<IPost, PaginateModel<IPost>>('Post', postSchema);
