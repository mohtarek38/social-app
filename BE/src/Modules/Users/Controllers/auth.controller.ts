import { Router } from "express";

import AuthService from "../Services/auth.service";
import { AuthenticationMiddleware, validationMiddleware } from "../../../Middlewares/middleware.barrel";
import {
  signUpValidator,
  confirmEmailValidator,
  refreshTokenValidator,
  forgetPasswordValidator,
  resetPasswordValidator,
  googleSignInValidator,
  resendOtpValidator,
} from "../../../Validators";

const authController = Router();

//Signup
authController.post("/signup",validationMiddleware(signUpValidator), AuthService.signUp);
//Signin
authController.post("/signin", AuthService.SignIn);
//Signout
authController.post("/signout", AuthenticationMiddleware, AuthService.SignOut);
//Confirmation Email
authController.post("/confirm-email", validationMiddleware(confirmEmailValidator), AuthService.ConfirmEmail);
//Refresh Token
authController.post("/refresh-token", validationMiddleware(refreshTokenValidator), AuthService.RefreshToken);
//Forget Password
authController.post("/forget-password", validationMiddleware(forgetPasswordValidator), AuthService.ForgetPassword);
//Reset Password
authController.post("/reset-password", validationMiddleware(resetPasswordValidator), AuthService.ResetPassword);

//Google OAuth
authController.post("/google", validationMiddleware(googleSignInValidator), AuthService.SignInWithGoogle);
//Resend Confirmation OTP
authController.post("/resend-confirmation", validationMiddleware(resendOtpValidator), AuthService.ResendConfirmationOtp);

export { authController };
