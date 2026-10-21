import z from "zod";
import { signUpValidator,updateProfileValidator } from "../../Validators/index";

export type SignUpBodyType = z.infer<typeof signUpValidator.body>;
export type ProfileUpdateBodyType = z.infer<typeof updateProfileValidator.body>;

