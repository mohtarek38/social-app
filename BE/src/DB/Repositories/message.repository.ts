import { IMessage } from '../../Common/Interfaces/interface.barrel';
import { BaseRepository } from './base.repository';
import { messagesModel } from '../Models/models.barrel';

export class MessageRepository extends BaseRepository<IMessage> {
  constructor() {
      super(messagesModel);
    }
}
