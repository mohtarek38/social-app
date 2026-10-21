import { Router } from 'express';
import postsService from './Services/posts.service';
import { AuthenticationMiddleware } from '../../Middlewares/authentication.middleware';
import { Multer, validationMiddleware } from '../../Middlewares/middleware.barrel';
import { paginationQuerySchema, postIdParamsValidator, updatePostValidator, userPostsValidator } from '../../Validators';
const postController = Router();

//Create a Post
postController.post('/add', AuthenticationMiddleware, Multer().array('files', 3), postsService.createPost);
//Update a Post
postController.put('/update/:postId', validationMiddleware(updatePostValidator), AuthenticationMiddleware, postsService.updatePost);
//Delete a Post
postController.delete('/delete/:postId', validationMiddleware(postIdParamsValidator), AuthenticationMiddleware, postsService.deletePost);
//Get all Posts
postController.get('/home', validationMiddleware({ query: paginationQuerySchema }), AuthenticationMiddleware, postsService.listHomePosts);
//Get all Posts by a User
postController.get('/user/:userId', validationMiddleware(userPostsValidator), AuthenticationMiddleware, postsService.listUserPosts);
//Get a Post by id
postController.get('/:postId', validationMiddleware(postIdParamsValidator), AuthenticationMiddleware, postsService.getPostById);

export { postController };
