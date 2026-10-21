import { IConversation } from '../../Common/Interfaces/interface.barrel';
import { BaseRepository } from './base.repository';
import { conversationModel } from '../Models/models.barrel';

export class ConversationRepository extends BaseRepository<IConversation> {
  constructor() {
    super(conversationModel);
  }
}
