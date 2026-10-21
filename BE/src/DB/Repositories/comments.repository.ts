import { IComment } from '../../Common/Interfaces/interface.barrel';
import { CommentModel } from '../Models/models.barrel';
import { BaseRepository } from './repository.barrel';

export class CommentRepository extends BaseRepository<IComment> {
  constructor() {
    super(CommentModel);
  }
}
