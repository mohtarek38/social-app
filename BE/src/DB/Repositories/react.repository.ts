import { IReact } from '../../Common/Interfaces/interface.barrel';
import { ReactModel } from '../Models/models.barrel';
import { BaseRepository } from './base.repository';

export class ReactRepository extends BaseRepository<IReact> {
  constructor() {
    super(ReactModel);
  }
}
