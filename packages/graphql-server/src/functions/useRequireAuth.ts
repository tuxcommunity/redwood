import type { APIGatewayEvent, Context as LambdaContext } from 'aws-lambda'

import { AuthDecoder } from '@redwoodjs/api'

import {
  getAsyncStoreInstance,
  context as globalContext,
} from '../globalContext'

import type { GetCurrentUser } from './types'

interface Args {
  handlerFn: (
    event: APIGatewayEvent,
    context: LambdaContext,
    ...others: any
  ) => any
  authDecoder: AuthDecoder
  getCurrentUser: GetCurrentUser
}

// @MARK: breaking changes

export const useRequireAuth = ({
  handlerFn,
  getCurrentUser,
  authDecoder,
}: Args) => {
  return async (
    event: APIGatewayEvent,
    context: LambdaContext,
    ...rest: any
  ) => {
    const authEnrichedFunction = async () => {
      try {
        const { result, metadata } = await authDecoder(event, context)

        // @MARK: any cases where we need to worry if result is null?
        if (result) {
          const currentUser = getCurrentUser
            ? await getCurrentUser(result, metadata)
            : null

          globalContext.currentUser = currentUser
        }
      } catch (e) {
        globalContext.currentUser = null

        if (process.env.NODE_ENV === 'development') {
          console.warn('This warning is only printed in development mode.')
          console.warn(
            "Always make sure to have `requireAuth('role')` inside your own handler function."
          )
          console.warn('')
          console.warn(e)
        }
      }

      return await handlerFn(event, context, ...rest)
    }

    if (getAsyncStoreInstance()) {
      // This must be used when you're self-hosting RedwoodJS.
      return getAsyncStoreInstance().run(new Map(), authEnrichedFunction)
    } else {
      // This is OK for AWS (Netlify/Vercel) because each Lambda request
      // is handled individually.
      return await authEnrichedFunction()
    }
  }
}
