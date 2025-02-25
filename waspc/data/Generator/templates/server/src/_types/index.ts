{{={= =}=}}
import { type Expand } from "../universal/types.js";
import { type Request, type Response } from 'express'
import { type ParamsDictionary as ExpressParams, type Query as ExpressQuery } from 'express-serve-static-core'
import prisma from "../dbClient.js"
{=# isAuthEnabled =}
import {
  type {= userEntityName =},
  type {= authEntityName =},
  type {= authIdentityEntityName =},
} from "../entities"
import {
  type EmailProviderData,
  type UsernameProviderData,
  type OAuthProviderData,
} from '../auth/utils.js'
{=/ isAuthEnabled =}
import { type _Entity } from "./taggedEntities"
import { type Payload } from "./serialization";

export * from "./taggedEntities"
export * from "./serialization"

export type Query<Entities extends _Entity[], Input extends Payload, Output extends Payload> = 
  Operation<Entities, Input, Output>

export type Action<Entities extends _Entity[], Input extends Payload, Output extends Payload> = 
  Operation<Entities, Input, Output>

{=# isAuthEnabled =}
export type AuthenticatedQuery<Entities extends _Entity[], Input extends Payload, Output extends Payload> = 
  AuthenticatedOperation<Entities, Input, Output>

export type AuthenticatedAction<Entities extends _Entity[], Input extends Payload, Output extends Payload> = 
  AuthenticatedOperation<Entities, Input, Output>

type AuthenticatedOperation<Entities extends _Entity[], Input extends Payload, Output extends Payload> = (
  args: Input,
  context: ContextWithUser<Entities>,
) => Output | Promise<Output>

export type AuthenticatedApi<
  Entities extends _Entity[],
  Params extends ExpressParams,
  ResBody,
  ReqBody,
  ReqQuery extends ExpressQuery,
  Locals extends Record<string, any>
> = (
  req: Request<Params, ResBody, ReqBody, ReqQuery, Locals>,
  res: Response<ResBody, Locals>,
  context: ContextWithUser<Entities>,
) => void

{=/ isAuthEnabled =}
type Operation<Entities extends _Entity[], Input, Output> = (
  args: Input,
  context: Context<Entities>,
) => Output | Promise<Output>

export type Api<
  Entities extends _Entity[],
  Params extends ExpressParams,
  ResBody,
  ReqBody,
  ReqQuery extends ExpressQuery,
  Locals extends Record<string, any>
> = (
  req: Request<Params, ResBody, ReqBody, ReqQuery, Locals>,
  res: Response<ResBody, Locals>,
  context: Context<Entities>,
) => void

type EntityMap<Entities extends _Entity[]> = {
  [EntityName in Entities[number]["_entityName"]]: PrismaDelegate[EntityName]
}

export type PrismaDelegate = {
  {=# entities =}
  "{= name =}": typeof prisma.{= prismaIdentifier =},
  {=/ entities =}
}

type Context<Entities extends _Entity[]> = Expand<{
  entities: Expand<EntityMap<Entities>>
}>

{=# isAuthEnabled =}
type ContextWithUser<Entities extends _Entity[]> = Expand<Context<Entities> & { user?: SanitizedUser }>

// TODO: This type must match the logic in auth/session.js (if we remove the
// password field from the object there, we must do the same here). Ideally,
// these two things would live in the same place:
// https://github.com/wasp-lang/wasp/issues/965

export type DeserializedAuthIdentity = Expand<Omit<{= authIdentityEntityName =}, 'providerData'> & {
  providerData: Omit<EmailProviderData, 'password'> | Omit<UsernameProviderData, 'password'> | OAuthProviderData
}>

export type SanitizedUser = {= userEntityName =} & {
  {= authFieldOnUserEntityName =}: {= authEntityName =} & {
    {= identitiesFieldOnAuthEntityName =}: DeserializedAuthIdentity[]
  } | null
}

export type { ProviderName } from '../auth/utils.js'
{=/ isAuthEnabled =}
