import { Model } from "mongoose";
import { IBlackListedToken } from "../../Common/Interfaces/user.interface";
import { BaseRepository } from "./base.repository";


export class BlackListedTokensRepository extends BaseRepository<IBlackListedToken> {
  constructor(protected _blacklistedTokensModel: Model<IBlackListedToken>) {
    super(_blacklistedTokensModel);
  }
}
