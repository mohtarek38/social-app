import { Router } from 'express';
import commentsService from './Services/comments.service';
import { AuthenticationMiddleware, validationMiddleware } from '../../Middlewares/middleware.barrel';
import { addCommentValidator, commentIdParamsValidator, postCommentsValidator, updateCommentValidator } from '../../Validators';
const commentController = Router();

// Add Comment (on a Post, or a reply on a Comment)
commentController.post('/add', validationMiddleware(addCommentValidator), AuthenticationMiddleware, commentsService.addComment);

// Update Comment
commentController.put('/update/:commentId', validationMiddleware(updateCommentValidator), AuthenticationMiddleware, commentsService.updateComment);

// Delete Comment
commentController.delete('/delete/:commentId', validationMiddleware(commentIdParamsValidator), AuthenticationMiddleware, commentsService.deleteComment);

// Get Comments for specific Post
commentController.get('/post/:postId', validationMiddleware(postCommentsValidator), AuthenticationMiddleware, commentsService.listPostComments);

// Get Replies for specific Comment
commentController.get('/:commentId/replies', validationMiddleware(commentIdParamsValidator), AuthenticationMiddleware, commentsService.listCommentReplies);

export { commentController };
