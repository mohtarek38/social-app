import { Router } from "express";

import AuthService from "../Services/auth.service";
import { AuthenticationMiddleware, validationMiddleware } from "../../../Middlewares/middleware.barrel";
import { signUpValidator } from "../../../Validators";

const authController = Router();

//Signup
authController.post("/signup",validationMiddleware(signUpValidator), AuthService.signUp);
//Signin
authController.post("/signin", AuthService.SignIn);
//Signout
authController.post("/signout", AuthenticationMiddleware, AuthService.SignOut);
//Confirmation Email

//Forget Password

//Reset Password

//Google OAuth

//Resend

export { authController };
