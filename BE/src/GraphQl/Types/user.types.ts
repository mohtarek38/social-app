import { GraphQLInt, GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql';

export const SayHelloResponseType = new GraphQLObjectType({
  name: 'SayHelloResponse',
  fields: {
    name: { type: GraphQLString, description: 'Name to greet' },
    age: { type: new GraphQLNonNull(GraphQLInt), description: 'Age of the person to greet' },
    id: { type: GraphQLInt, description: 'ID of the person to greet' },
  },
});

export const UserType = new GraphQLObjectType({
  name: 'UserType',
  fields: {
    firstName: { type: GraphQLString, description: 'First name of the user' },
    lastName: { type: GraphQLString, description: 'Last name of the user' },
    email: { type: GraphQLString, description: 'Email of the user' },
  },
});
