import { Plugin } from '@graphql-yoga/common'

import {
  GraphQLHandlerOptions,
  RedwoodGraphQLContext,
} from '../functions/types'

/**
 * Envelop plugin for injecting the current user into the GraphQL Context,
 * based on custom getCurrentUser function.
 */
export const useRedwoodAuthContext = (
  getCurrentUser: GraphQLHandlerOptions['getCurrentUser'],
  authDecoder: GraphQLHandlerOptions['authDecoder']
): Plugin<RedwoodGraphQLContext> => {
  if (!authDecoder) {
    // If no auth decoder is supplied there's nothing to do
    return {}
  }

  return {
    async onContextBuilding({ context, extendContext }) {
      // requestContext is Lambda context
      const { requestContext } = context

      let result = undefined
      let metadata = undefined

      try {
        ;({ result, metadata } = await authDecoder(
          context.event,
          requestContext
        ))
      } catch (error: any) {
        throw new Error(`Exception in authDecoder: ${error.message}`)
      }

      try {
        if (result) {
          const currentUser = getCurrentUser
            ? await getCurrentUser(result, metadata, {
                event: context.event,
                context: requestContext,
              })
            : null

          extendContext({ currentUser })
        }
      } catch (error: any) {
        throw new Error(`Exception in getCurrentUser: ${error.message}`)
      }
    },
  }
}
