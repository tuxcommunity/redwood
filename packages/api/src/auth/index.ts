export * from './parseJWT'

import type { APIGatewayProxyEvent, Context as LambdaContext } from 'aws-lambda'

import type { SupportedAuthTypes } from '@redwoodjs/auth'

export type AuthDecoderResult<
  TDecoderType = string,
  TResult = Record<string, unknown> | string | null
> = {
  result: TResult
  // @MARK this makes it a breaking change, but thats OK
  // We need to decide what other things are useful here
  metadata: { type: TDecoderType; token: string }
}

// @MARK AuthDecoder type sits in rwjs/api package but is only used in graphql-server
// It feels more right to sit in api though... when imported
// @TODO think about how we make this less tied to Lambdas.
//  Maybe another generic? But then how does the user pass the context/event - and do they need to?
export type AuthDecoder<
  TDecoderType = string,
  TResult = Record<string, unknown> | string | null
> = (
  event: APIGatewayProxyEvent,
  context: LambdaContext
) =>
  | Promise<AuthDecoderResult<TDecoderType, TResult>>
  | AuthDecoderResult<TDecoderType, TResult>

// This is shared by `@redwoodjs/web`
const AUTH_PROVIDER_HEADER = 'auth-provider'

export const getAuthProviderHeader = (
  event: APIGatewayProxyEvent
): SupportedAuthTypes => {
  return event?.headers[AUTH_PROVIDER_HEADER] as SupportedAuthTypes
}

export interface AuthorizationHeader {
  schema: 'Bearer' | 'Basic' | string
  token: string
}
/**
 * Split the `Authorization` header into a schema and token part.
 */
export const parseAuthorizationHeader = (
  event: APIGatewayProxyEvent,
  headerName = 'authorization'
): AuthorizationHeader => {
  // @MARK INCOMPLETE!!! should we use something like https://www.npmjs.com/package/header-case
  const parts = (
    event.headers?.[headerName] || event.headers?.Authorization
  )?.split(' ')
  if (parts?.length !== 2) {
    throw new Error(`The ${headerName} header is not valid.`)
  }
  const [schema, token] = parts
  if (!schema.length || !token.length) {
    throw new Error(`The ${headerName} header is not valid.`)
  }
  return { schema, token }
}
