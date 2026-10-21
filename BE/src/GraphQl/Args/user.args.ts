import { GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql";


export const SayHelloArgs = {
    name: { type: GraphQLString, description: 'Name to greet' },
    age: { type: new GraphQLNonNull(GraphQLInt), description: 'Age of the person to greet' },
}