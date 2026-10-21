import mongoose from "mongoose";
import { FriendShipStatusEnum } from "../../Common/common.barrel";
import { IFriendship } from "../../Common/Interfaces/user.interface";

const friendShipSchema = new mongoose.Schema<IFriendship>({
    requestFromId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
    },
    requestToId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
    },
    status: {
        type: String,
        enum: FriendShipStatusEnum,
        default: FriendShipStatusEnum.PENDING,
    },
}, { timestamps: true });
export const FriendShipModel = mongoose.model<IFriendship>("FriendShips", friendShipSchema);
