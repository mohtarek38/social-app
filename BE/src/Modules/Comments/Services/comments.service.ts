import { Request, Response } from 'express';
import { UserModel } from '../../../DB/Models/models.barrel';
import { CommentRepository, PostRepository, ReactRepository } from '../../../DB/Repositories/repository.barrel';
import { SuccessResponse } from '../../../Utils/Responses/response-helper.utils';
import { IComment, ILoggedInRequest } from '../../../Common/Interfaces/interface.barrel';
import { BadRequestException, ForbiddenException, NotFoundException } from '../../../Utils/utils.barrel';

class CommentsService {
  private commentRepo = new CommentRepository();
  private postRepo = new PostRepository();
  private reactRepo = new ReactRepository();

  addComment = async (req: Request, res: Response) => {
    const {
      user: { _id },
    } = (req as ILoggedInRequest).loggedInUser;
    const { refId, onModel, content } = req.body;

    if (onModel === 'Post') {
      const post = await this.postRepo.findOneDocument({ _id: refId });
      if (!post) throw new NotFoundException('Post not found');
      if (post.allowComments === false) throw new BadRequestException('Comments are disabled on this post');
    } else {
      // Reply to a comment (only one level of replies)
      const parentComment = await this.commentRepo.findOneDocument({ _id: refId });
      if (!parentComment) throw new NotFoundException('Comment not found');
      if (parentComment.onModel === 'Comment') throw new BadRequestException('You can not reply to a reply');
    }

    const newComment: IComment = await this.commentRepo.createNewDocument({ content, ownerId: _id, refId, onModel });
    res.status(201).json(SuccessResponse<unknown>('Comment added successfully', 201, newComment));
  };

  updateComment = async (req: Request, res: Response) => {
    const {
      user: { _id },
    } = (req as ILoggedInRequest).loggedInUser;
    const { commentId } = req.params;
    const { content } = req.body;

    const comment = await this.commentRepo.findOneDocument({ _id: commentId });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.ownerId.toString() !== _id.toString()) throw new ForbiddenException('You can only update your own comments');

    const updatedComment = await this.commentRepo.findAndUpdateDocument(comment._id as any, { content });
    res.status(200).json(SuccessResponse<unknown>('Comment updated successfully', 200, updatedComment));
  };

  deleteComment = async (req: Request, res: Response) => {
    const {
      user: { _id },
    } = (req as ILoggedInRequest).loggedInUser;
    const { commentId } = req.params;

    const comment = await this.commentRepo.findOneDocument({ _id: commentId });
    if (!comment) throw new NotFoundException('Comment not found');

    // The comment owner or the post owner can delete a comment
    let isAllowed = comment.ownerId.toString() === _id.toString();
    if (!isAllowed && comment.onModel === 'Post') {
      const post = await this.postRepo.findOneDocument({ _id: comment.refId });
      isAllowed = post?.ownerId.toString() === _id.toString();
    }
    if (!isAllowed) throw new ForbiddenException('You can not delete this comment');

    // Delete the comment with its replies and reacts
    const replies = await this.commentRepo.findDocuments({ refId: comment._id, onModel: 'Comment' }, '_id');
    const ids = [comment._id, ...replies.map((reply) => reply._id)];
    await this.commentRepo.deleteMultipleDocuments({ _id: { $in: ids } });
    await this.reactRepo.deleteMultipleDocuments({ refId: { $in: ids } });
    res.status(200).json(SuccessResponse<unknown>('Comment deleted successfully', 200));
  };

  listPostComments = async (req: Request, res: Response) => {
    const { postId } = req.params;
    const comments = await this.commentRepo.findDocuments({ refId: postId, onModel: 'Post' }, undefined, {
      sort: { createdAt: -1 },
      populate: [{ path: 'ownerId', model: UserModel, select: '_id firstName lastName' }],
    });
    res.status(200).json(SuccessResponse<IComment[]>('Comments retrieved successfully', 200, comments));
  };

  listCommentReplies = async (req: Request, res: Response) => {
    const { commentId } = req.params;
    const replies = await this.commentRepo.findDocuments({ refId: commentId, onModel: 'Comment' }, undefined, {
      sort: { createdAt: 1 },
      populate: [{ path: 'ownerId', model: UserModel, select: '_id firstName lastName' }],
    });
    res.status(200).json(SuccessResponse<IComment[]>('Replies retrieved successfully', 200, replies));
  };
}
export default new CommentsService();
