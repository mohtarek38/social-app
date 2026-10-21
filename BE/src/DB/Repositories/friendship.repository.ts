import { FilterQuery, Schema } from "mongoose";
import { FriendShipStatusEnum } from "../../Common/common.barrel";
import { IFriendship } from "../../Common/Interfaces/interface.barrel";
import { FriendShipModel, UserModel } from "../Models/models.barrel";
import { BaseRepository } from "./base.repository";

export class FriendshipRepository extends BaseRepository<IFriendship> {
  constructor() {
    super(FriendShipModel);
  }

  getFriendshipRequests = async (userId: Schema.Types.ObjectId, status: FriendShipStatusEnum) => {
    const filters: FilterQuery<IFriendship> = { status };
    if (status === FriendShipStatusEnum.ACCEPTED) {
      filters.$or = [{ requestFromId: userId }, { requestToId: userId }];
    } else {
      filters.requestToId = userId;
    }
    return this.findDocuments(filters, undefined, {
      populate: [
        {
          path: "requestFromId",
          model: UserModel,
          select: "_id firstName lastName",
        },
        {
          path: "requestToId",
          model: UserModel,
          select: "_id firstName lastName",
        },
      ],
      lean: true,
    });
  };

  findPendingFriendRequest = async (requestId: Schema.Types.ObjectId, requestToId: Schema.Types.ObjectId) => {
    return this.findOneDocument({
      _id: requestId,
      requestToId,
      status: FriendShipStatusEnum.PENDING,
    });
  };

  updateFriendRequestStatus = async (requestId: Schema.Types.ObjectId, status: FriendShipStatusEnum) => {
    return this.findAndUpdateDocument(requestId, { status });
  };
}
