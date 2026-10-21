import mongoose, { Model, ProjectionType } from "mongoose";
import { IUser } from "../../Common/Interfaces/user.interface";
import { BaseRepository } from "./base.repository";

export class UserRepository extends BaseRepository<IUser> {
  constructor(protected _usermodel: Model<IUser>) {
    super(_usermodel);
  }
  // FindUserById without password
  findUserByIdSafely = async (_id: mongoose.Schema.Types.ObjectId): Promise<IUser | null> => {
    return await this.findDocumentById(_id, "-password");
  };
  // Check if EmailExists returns true or false
  isEmailExists = async (email: string): Promise<boolean> => {
    const user = await this.findOneDocument({ email }, "email");
    return !!user;
  };
  // Delete account and unset images
  deleteAccountAndUnsetImages = async (_id: mongoose.Schema.Types.ObjectId) => {
    return await this.findAndUpdateDocument(
      _id,
      {
        isDeleted: true,
        $unset: { profilePicture: "", coverPicture: "" },
      } as any,
      { select: "_id email isDeleted" }
    );
  };
  // Update Profile without returning password
  updateUserProfile = async (_id: mongoose.Schema.Types.ObjectId, updateData: Partial<IUser>): Promise<IUser | null> => {
    return await this.findAndUpdateDocument(_id, updateData, { select: "-password -otps" });
  };
  // Find password by Id
  findPasswordById = async (_id: mongoose.Schema.Types.ObjectId): Promise<IUser | null> => {
    return await this.findOneDocument({ _id }, "password");
  };

  getUserPrivate = async (_id: mongoose.Schema.Types.ObjectId): Promise<IUser | null> => {
    return await this.findOneDocument({ _id }, "firstName lastName role email gender DOB phoneNumber age");
  };
  getUserPublic = async (userId: string): Promise<IUser | null> => {
    return await this.findOneDocument({ _id: new mongoose.Types.ObjectId(userId), isDeleted: false }, "firstName lastName profilePicture coverPicture gender age");
  };
}
