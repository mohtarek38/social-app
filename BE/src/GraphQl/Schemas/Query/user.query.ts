import { SayHelloResponseType, UserType } from '../../Types/user.types';
import { SayHelloArgs } from '../../Args/user.args';
import UserResolver from '../../Resolvers/user.resolvers';
import { GraphQLList } from 'graphql';

class UserQuery {
  private userResolver: UserResolver = new UserResolver();
  register() {
    return {
      sayHello: {
        type: SayHelloResponseType,
        args: SayHelloArgs,
        resolve: this.userResolver.sayHello,
      },
      listUsers:{
        type: new GraphQLList(UserType),
        resolve: this.userResolver.listUsers,
      }
    };
  }
}

export default new UserQuery();
