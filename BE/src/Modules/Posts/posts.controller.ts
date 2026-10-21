import { Router } from 'express';
import postsService from './Services/posts.service';
import { AuthenticationMiddleware } from '../../Middlewares/authentication.middleware';
import { Multer } from '../../Middlewares/middleware.barrel';
const postController = Router();

//Create a Post
postController.post('/add', AuthenticationMiddleware, Multer().array('files', 3), postsService.createPost);
//Update a Post

//Delete a Post

//Get all Posts
postController.get('/home', AuthenticationMiddleware, postsService.listHomePosts);
//Get a Post by id

//Get all Posts by a User

export { postController };
