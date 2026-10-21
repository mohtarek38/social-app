import { Request, Response } from 'express';
import { UserModel } from '../../../DB/Models/models.barrel';
import { CommentRepository, PostRepository, ReactRepository } from '../../../DB/Repositories/repository.barrel';
import { SuccessResponse } from '../../../Utils/Responses/response-helper.utils';
import { ILoggedInRequest, IReact } from '../../../Common/Interfaces/interface.barrel';
import { NotFoundException } from '../../../Utils/utils.barrel';

class ReactsService {
  private reactRepo = new ReactRepository();
  private postRepo = new PostRepository();
  private commentRepo = new CommentRepository();

  // Add a react, or change it if the user already reacted
  react = async (req: Request, res: Response) => {
    const {
      user: { _id },
    } = (req as ILoggedInRequest).loggedInUser;
    const { refId, onModel, type } = req.body;

    const target = onModel === 'Post' ? await this.postRepo.findOneDocument({ _id: refId }) : await this.commentRepo.findOneDocument({ _id: refId });
    if (!target) throw new NotFoundException(`${onModel} not found`);

    const existingReact = await this.reactRepo.findOneDocument({ ownerId: _id, refId });
    if (existingReact) {
      const updatedReact = await this.reactRepo.findAndUpdateDocument(existingReact._id as any, { type });
      return res.status(200).json(SuccessResponse<unknown>('React updated successfully', 200, updatedReact));
    }
    const newReact: IReact = await this.reactRepo.createNewDocument({ ownerId: _id, refId, onModel, type });
    return res.status(201).json(SuccessResponse<unknown>('React added successfully', 201, newReact));
  };

  removeReact = async (req: Request, res: Response) => {
    const {
      user: { _id },
    } = (req as ILoggedInRequest).loggedInUser;
    const { refId } = req.params;

    const result = await this.reactRepo.deleteOneDocument({ ownerId: _id, refId });
    if (!result.deletedCount) throw new NotFoundException('React not found');
    res.status(200).json(SuccessResponse<unknown>('React removed successfully', 200));
  };

  listReacts = async (req: Request, res: Response) => {
    const { refId } = req.params;
    const reacts = await this.reactRepo.findDocuments({ refId }, 'ownerId type', {
      populate: [{ path: 'ownerId', model: UserModel, select: '_id firstName lastName' }],
    });
    // Count of each react type, e.g. { LIKE: 3, LOVE: 1 }
    const summary = reacts.reduce<Record<string, number>>((acc, { type }) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    res.status(200).json(SuccessResponse<unknown>('Reacts retrieved successfully', 200, { total: reacts.length, summary, reacts }));
  };
}
export default new ReactsService();
