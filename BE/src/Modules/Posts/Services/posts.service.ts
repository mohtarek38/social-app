import { NextFunction, Request, Response } from 'express';
import { UserModel } from '../../../DB/Models/models.barrel';
import { CommentRepository, FriendshipRepository, PostRepository, ReactRepository, UserRepository } from '../../../DB/Repositories/repository.barrel';
import { SuccessResponse } from '../../../Utils/Responses/response-helper.utils';
import { ILoggedInRequest, IPost } from '../../../Common/Interfaces/interface.barrel';
import { FriendShipStatusEnum } from '../../../Common/common.barrel';
import { getPagination, BadRequestException, ForbiddenException, NotFoundException, S3ClientService } from '../../../Utils/utils.barrel';
import { Types } from 'mongoose';

class PostsService {
  private postRepo = new PostRepository();
  private userRepo = new UserRepository(UserModel);
  private friendShipRepo = new FriendshipRepository();
  private commentRepo = new CommentRepository();
  private reactRepo = new ReactRepository();
  private S3Client = new S3ClientService();

  createPost = async (req: Request, res: Response, next: NextFunction) => {
    const {
      user: { _id },
    } = (req as ILoggedInRequest).loggedInUser;
    const { description, allowComments, tags } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!description && !files?.length) throw new BadRequestException('Post must have either description or media');

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
      { limit: Number(limit) || 10, page: Number(page) || 1, sort: { createdAt: -1 }, customLabels: { meta: 'paginator' } },
    );
    res.status(200).json(SuccessResponse<unknown>('Home posts retrieved successfully', 200, posts));
  };

  getPostById = async (req: Request, res: Response, next: NextFunction) => {
    const { postId } = req.params;
    const post = await this.postRepo.findOneDocument({ _id: postId }, undefined, {
      populate: [{ path: 'ownerId', model: UserModel, select: '_id firstName lastName' }],
    });
    if (!post) throw new NotFoundException('Post not found');
    res.status(200).json(SuccessResponse<unknown>('Post retrieved successfully', 200, post));
  };

  listUserPosts = async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    const { page, limit } = req.query;
    const posts = await this.postRepo.findDocumentsWithPagination(
      { ownerId: userId },
      { limit: Number(limit) || 10, page: Number(page) || 1, sort: { createdAt: -1 }, customLabels: { meta: 'paginator' } },
    );
    res.status(200).json(SuccessResponse<unknown>('User posts retrieved successfully', 200, posts));
  };

  updatePost = async (req: Request, res: Response, next: NextFunction) => {
    const {
      user: { _id },
    } = (req as ILoggedInRequest).loggedInUser;
    const { postId } = req.params;
    const { description, allowComments } = req.body;

    const post = await this.postRepo.findOneDocument({ _id: postId });
    if (!post) throw new NotFoundException('Post not found');
    if (post.ownerId.toString() !== _id.toString()) throw new ForbiddenException('You can only update your own posts');

    const updatedPost = await this.postRepo.findAndUpdateDocument(post._id as any, { description, allowComments });
    res.status(200).json(SuccessResponse<unknown>('Post updated successfully', 200, updatedPost));
  };

  deletePost = async (req: Request, res: Response, next: NextFunction) => {
    const {
      user: { _id },
    } = (req as ILoggedInRequest).loggedInUser;
    const { postId } = req.params;

    const post = await this.postRepo.findOneDocument({ _id: postId });
    if (!post) throw new NotFoundException('Post not found');
    if (post.ownerId.toString() !== _id.toString()) throw new ForbiddenException('You can only delete your own posts');

    // Delete the post with its comments and reacts
    const comments = await this.commentRepo.findDocuments({ refId: post._id, onModel: 'Post' }, '_id');
    const commentIds = comments.map((comment) => comment._id);
    await this.commentRepo.deleteMultipleDocuments({ $or: [{ _id: { $in: commentIds } }, { refId: { $in: commentIds }, onModel: 'Comment' }] });
    await this.reactRepo.deleteMultipleDocuments({ refId: { $in: [post._id, ...commentIds] } });
    await this.postRepo.deleteOneDocument({ _id: post._id });
    try {
      if (post.attachments?.length) {
        await this.S3Client.deleteBulkFilesFromS3(post.attachments);
      }
    } catch (error) {
      console.error('Failed to delete S3 files:', error);
    }
    res.status(200).json(SuccessResponse<unknown>('Post deleted successfully', 200));
  };
}
export default new PostsService();
