import { NextFunction, Request, Response } from 'express';
import { UserModel } from '../../../DB/Models/models.barrel';
import { FriendshipRepository, PostRepository, UserRepository } from '../../../DB/Repositories/repository.barrel';
import { SuccessResponse } from '../../../Utils/Responses/response-helper.utils';
import { ILoggedInRequest, IPost } from '../../../Common/Interfaces/interface.barrel';
import { FriendShipStatusEnum } from '../../../Common/common.barrel';
import { getPagination, BadRequestException, S3ClientService } from '../../../Utils/utils.barrel';
import { Types } from 'mongoose';

class PostsService {
  private postRepo = new PostRepository();
  private userRepo = new UserRepository(UserModel);
  private friendShipRepo = new FriendshipRepository();
  private S3Client = new S3ClientService();

  createPost = async (req: Request, res: Response, next: NextFunction) => {
    const {
      user: { _id },
    } = (req as ILoggedInRequest).loggedInUser;
    const { description, allowComments, tags } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!description && files && !files.length) throw new Error('Post must have either description or media');

    let uniqueTags: Types.ObjectId[] = [];
    if (tags) {
      const taggedUsers = await this.userRepo.findDocuments({ _id: { $in: tags } });
      if (taggedUsers.length !== tags.length) throw new BadRequestException('Some tagged users not found');
      const friends = await this.friendShipRepo.findDocuments({
        status: FriendShipStatusEnum.ACCEPTED,
        $or: [
          { requestFromId: _id, requestToId: { $in: tags } },
          { requestFromId: { $in: tags }, requestToId: _id },
        ],
      });

      if (friends.length !== tags.length) throw new BadRequestException('You can only tag your friends in a post');
      uniqueTags = Array.from(new Set(tags));
    }
    let attachments: string[] = [];
    if (files?.length) {
      const uploadedData = await this.S3Client.uploadMultipleFilesOnS3(files, `${_id}/posts`);
      attachments = uploadedData.map(({ key }) => key);
    }

    const newPost: IPost = await this.postRepo.createNewDocument({
      description,
      attachments,
      ownerId: _id,
      allowComments,
      tags: uniqueTags,
    });
    res.status(201).json(SuccessResponse<unknown>('Post created successfully', 201, newPost));
  };
  listHomePosts = async (req: Request, res: Response, next: NextFunction) => {
    const { page, limit } = req.query;
    const posts = await this.postRepo.findDocumentsWithPagination(
      {},
      { limit: Number(limit), page: Number(page), customLabels: { meta: 'paginator' } },
    );
    res.status(200).json(SuccessResponse<unknown>('Home posts retrieved successfully', 200, posts));
  };
}
export default new PostsService();
