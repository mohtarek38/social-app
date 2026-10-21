import { UserModel } from '../../DB/Models/user.model';
import { UserRepository } from '../../DB/Repositories/user.repository';
import { UnauthorizedException, verifyToken } from '../../Utils/utils.barrel';

// Verifies the "Bearer <token>" authorization header passed in the GraphQL context
const authenticate = (context: any) => {
  const authorization: string | undefined = context?.authorization;
  const [prefix, token] = authorization?.split(' ') ?? [];
  if (prefix !== process.env.JWT_PREFIX || !token) {
    throw new UnauthorizedException('Please login first');
  }
  return verifyToken(token, process.env.JWT_ACCESS_SECRET as string);
};

class UserResolver {
  private userRepo: UserRepository = new UserRepository(UserModel);
  sayHello = (__: any, args: any, context: any) => {
    return { ...args, id: 8 };
  };

  listUsers = async (__: any, args: any, context: any) => {
    authenticate(context);
    const userList = await this.userRepo.findDocuments({ isDeleted: { $ne: true } }, { firstName: 1, lastName: 1, email: 1 });
    return userList;
  };
}

export default UserResolver;
