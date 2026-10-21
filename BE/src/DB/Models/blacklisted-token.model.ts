import mongoose from "mongoose";
import { IBlackListedToken } from "../../Common/Interfaces/user.interface";

const blackListedTokensSchema = new mongoose.Schema<IBlackListedToken>(
  {
    tokenId: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
  },
  { timestamps: true }
);

const BlackListedTokensModel = mongoose.model<IBlackListedToken>("BlacListedTokens", blackListedTokensSchema);
export { BlackListedTokensModel };
