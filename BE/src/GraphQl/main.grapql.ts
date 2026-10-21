import { GraphQLObjectType, GraphQLSchema } from 'graphql';
import userQuery from './Schemas/Query/user.query';


// Define your GraphQL schema here
export const MainSchema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    description: 'Root Query',
    fields: {
        ...userQuery.register()
    },
  }),
//   mutation: new GraphQLObjectType({
//     name: 'Mutation',
//     description: 'Root Mutation',
//     fields: {

//     },
//   }),
});
