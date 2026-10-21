import { Request, Response } from 'express';
import { BadRequestException, compareHash, decrypt, encrypt, generateHash, S3ClientService } from '../../../Utils/utils.barrel';
import { IFriendship, ILoggedInRequest } from '../../../Common/Interfaces/user.interface';
import { SuccessResponse } from '../../../Utils/Responses/response-helper.utils';
import { ConversationRepository, FriendshipRepository, UserRepository } from '../../../DB/Repositories/repository.barrel';
import { UserModel } from '../../../DB/Models/models.barrel';
import { FriendShipStatusEnum, ProfileUpdateBodyType, ProviderEnum } from '../../../Common/common.barrel';

export class ProfileService {
  constructor(
    private userRepo: UserRepository = new UserRepository(UserModel),
    private friendshipRepo: FriendshipRepository = new FriendshipRepository(),
    private conversationRepo: ConversationRepository = new ConversationRepository(),
    private s3Client: S3ClientService = new S3ClientService(),
  ) {}

  // private userRepo = new UserRepository(UserModel);
  // private s3Client = new S3ClientService();
  // private friendshipRepo = new FriendshipRepository();
  // private conversationRepo = new ConversationRepository();

  uploadProfilePicture = async (req: Request, res: Response) => {
    const { file } = req;
    const {
      user: { _id },
    } = (req as ILoggedInRequest).loggedInUser;
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const { key, url } = await this.s3Client.uploadOneFileOnS3(file, `${_id}/profile_pictures`);
    await this.userRepo.findAndUpdateDocument(_id, { profilePicture: key });
    res.status(200).json(SuccessResponse<unknown>('Profile picture uploaded successfully', 200, { key, url }));
  };

  getProfilePictureSignedUrl = async (req: Request, res: Response) => {
    const { profilePicture: fileKey } = (req as ILoggedInRequest).loggedInUser.user;
    if (!fileKey) {
      throw new BadRequestException('No profile picture found!');
    }
    const signedUrl = await this.s3Client.getFileWithSignedURL(fileKey, 60);
    res.status(200).json(SuccessResponse<unknown>('Signed URL generated successfully', 200, { url: signedUrl }));
  };

  renewSignedUrl = async (req: Request, res: Response) => {
    const { user } = (req as ILoggedInRequest).loggedInUser;
    const { key, keyType }: { key: string; keyType: 'profilePicture' | 'coverPicture' } = req.body;
    if (!key) {
      throw new BadRequestException('File key is required');
    }
    if (user[keyType] !== key) {
      throw new BadRequestException('Invalid key');
    }
    const signedUrl = await this.s3Client.getFileWithSignedURL(key, 60);
    res.status(200).json(SuccessResponse<unknown>('Signed URL renewed successfully', 200, { key, url: signedUrl }));
  };

  deleteAccount = async (req: Request, res: Response) => {
    const {
      user: { _id, profilePicture, coverPicture },
    } = (req as ILoggedInRequest).loggedInUser;
    const result = await this.userRepo.deleteAccountAndUnsetImages(_id);
    try {
      if (profilePicture) {
        await this.s3Client.deleteFileFromS3(profilePicture);
      }
      if (coverPicture) {
        await this.s3Client.deleteFileFromS3(coverPicture);
      }
    } catch (error) {
      console.error('Failed to delete S3 files:', error);
    }
    res.status(200).json(SuccessResponse<unknown>('User account deleted successfully', 200, result));
  };

  getLoggedInProfile = async (req: Request, res: Response) => {
    const {
      user: { _id },
    } = (req as ILoggedInRequest).loggedInUser;
    const userProfile = await this.userRepo.getUserPrivate(_id);
    if (!userProfile) {
      throw new BadRequestException('User not found');
    }
    userProfile.phoneNumber = userProfile.phoneNumber ? decrypt(userProfile.phoneNumber) : undefined;
    res.status(200).json(SuccessResponse<unknown>('User profile fetched successfully', 200, userProfile));
  };

  getPublicProfile = async (req: Request, res: Response) => {
    const { userId } = req.params;
    const userProfile = await this.userRepo.getUserPublic(userId);
    if (!userProfile) {
      throw new BadRequestException('User not found');
    }
    userProfile.phoneNumber = userProfile.phoneNumber ? decrypt(userProfile.phoneNumber) : undefined;
    res.status(200).json(SuccessResponse<unknown>('User public profile fetched successfully', 200, userProfile));
  };

  updateProfile = async (req: Request, res: Response) => {
    const {
      user: { _id, provider },
    } = (req as ILoggedInRequest).loggedInUser;

    const updateData = req.body as ProfileUpdateBodyType;

    if (updateData.password) {
      if (provider !== ProviderEnum.LOCAL) {
        throw new BadRequestException('Password update is only allowed for LOCAL provider users');
      }
      const user = await this.userRepo.findPasswordById(_id);
      if (!compareHash(updateData.currentPassword!, user!.password)) {
        throw new BadRequestException('Current password is incorrect');
      }
      updateData.password = generateHash(updateData.password);
    }
    if (updateData.phoneNumber) updateData.phoneNumber = encrypt(updateData.phoneNumber);
    const updatedUser = await this.userRepo.updateUserProfile(_id, updateData);
    res.status(200).json(SuccessResponse<unknown>('User profile updated successfully', 200, updatedUser));
  };

  sendFriendRequest = async (req: Request, res: Response) => {
    const {
      user: { _id },
    } = (req as ILoggedInRequest).loggedInUser;
    const { requestToId } = req.body;

    if (requestToId === _id.toString()) {
      throw new BadRequestException('You cannot send a friend request to yourself');
    }
    const user = await this.userRepo.findDocumentById(requestToId);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    await this.friendshipRepo.createNewDocument({ requestFromId: _id, requestToId, status: FriendShipStatusEnum.PENDING });
    res.status(200).json(SuccessResponse<unknown>('Friend request sent successfully', 200, null));
  };

  listRequests = async (req: Request, res: Response) => {
    const {
      user: { _id },
    } = (req as ILoggedInRequest).loggedInUser;
    const { status } = req.query as { status: FriendShipStatusEnum };

    const requests = await this.friendshipRepo.getFriendshipRequests(_id, status);
    res.status(200).json(SuccessResponse<IFriendship[]>('Friend requests fetched successfully', 200, requests));
  };

  respondToFriendRequest = async (req: Request, res: Response) => {
    const {
      user: { _id },
    } = (req as ILoggedInRequest).loggedInUser;
    const { requestId, action } = req.body;

    const friendRequest = await this.friendshipRepo.findPendingFriendRequest(requestId, _id);
    if (!friendRequest) {
      throw new BadRequestException('Friend request not found or already responded');
    }

    const updatedRequest = await this.friendshipRepo.updateFriendRequestStatus(requestId, action);
    if (!updatedRequest) {
      throw new BadRequestException('Failed to update friend request status');
    }
    res.status(200).json(SuccessResponse<IFriendship>('Responded to friend request successfully', 200, updatedRequest));
  };

  createGroup = async (req: Request, res: Response) => {
    const {
      user: { _id },
    } = (req as ILoggedInRequest).loggedInUser;
    const { name, memberIds } = req.body;
    const members = await this.userRepo.findDocuments({ _id: { $in: memberIds } });
    if (members.length !== memberIds.length) {
      throw new BadRequestException('Members not found');
    }
    const friendShip = await this.friendshipRepo.findDocuments({
      $or: [
        { requestFromId: _id, requestToId: { $in: memberIds } },
        { requestFromId: { $in: memberIds }, requestToId: _id },
      ],
      status: FriendShipStatusEnum.ACCEPTED,
    });
    if (friendShip.length !== memberIds.length) {
      throw new BadRequestException('You can only create a group with your friends');
    }
    const group = await this.conversationRepo.createNewDocument({ type: 'group', name, members: [_id, ...memberIds] });
    res.status(200).json(SuccessResponse<unknown>('Group created successfully', 200, group));
  };
}
export default new ProfileService();
