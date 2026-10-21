import { Router } from 'express';
import reactsService from './Services/reacts.service';
import { AuthenticationMiddleware, validationMiddleware } from '../../Middlewares/middleware.barrel';
import { reactValidator, refIdParamsValidator } from '../../Validators';
const reactController = Router();

//React to a Post or Comment
reactController.post('/react', validationMiddleware(reactValidator), AuthenticationMiddleware, reactsService.react);

//Remove Reaction from a Post or Comment
reactController.delete('/remove/:refId', validationMiddleware(refIdParamsValidator), AuthenticationMiddleware, reactsService.removeReact);

//Get all Reactions for a specific Post or Comment
reactController.get('/:refId', validationMiddleware(refIdParamsValidator), AuthenticationMiddleware, reactsService.listReacts);

export { reactController };
