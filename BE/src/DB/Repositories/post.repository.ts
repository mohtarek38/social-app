import { FilterQuery, PaginateOptions, ProjectionType, QueryOptions } from 'mongoose';
import { IPost } from '../../Common/Interfaces/interface.barrel';
import { PostModel } from '../Models/models.barrel';
import { BaseRepository } from './base.repository';

export class PostRepository extends BaseRepository<IPost> {
  constructor() {
    super(PostModel);
  }
  // count documents
  async countDocuments() {
    return await PostModel.countDocuments();
  }
  async findDocumentsWithPagination(filters?: FilterQuery<IPost>, options?: PaginateOptions) {
    return await PostModel.paginate(filters, options);
  }
}
