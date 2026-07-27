import { requireTenantAccess } from "@codexsun/framework/api";
import type { FastifyInstance } from "fastify";
import type { FastifyRequest } from "fastify";
import { authorizeCorePrincipal, authorizeCoreRequest } from "./auth/tenant-permission.js";
import {
  bootstrapCoreDatabase,
  resolveCoreDatabaseName,
  runWithCoreDatabase
} from "./database/core-database.js";
import { env } from "./env.js";
import { commonModule } from "./modules/common/index.js";
import { commonApiModuleKeys } from "./modules/common/common.module.js";
import { locationModules } from "./modules/common/location/location.module.js";
import { masterModule } from "./modules/master/index.js";
import { organisationModule } from "./modules/organisation/index.js";
import { organisationApiModuleKeys } from "./modules/organisation/organisation.module.js";
import { masterApiModuleKeys } from "./modules/master/master.module.js";
import type { Kysely } from "kysely";
import type { CoreDatabase } from "./database/core-database.js";

export const coreApiModuleKeys = [
  commonModule.key,
  organisationModule.key,
  masterModule.key,
  ...locationModules.map((module) => module.key)
];

export const coreApiComponentKeys = [
  ...commonApiModuleKeys,
  ...organisationApiModuleKeys,
  ...masterApiModuleKeys
] as const;

export async function registerCoreApi(app: FastifyInstance) {
  return registerCoreApiForHost(app, {
    async resolve(request) {
      const value = request.headers["x-tenant-db"];
      const databaseName = resolveCoreDatabaseName(Array.isArray(value) ? value[0] : value);
      const claims = requireTenantAccess({
        authorization: request.headers.authorization,
        secret: env.JWT_SECRET,
        tenantDatabase: databaseName,
        tenantId: request.headers["x-tenant-id"]
      });
      return {
        actor: {
          id: claims.userId ?? claims.email ?? "tenant-user",
          permissions: [],
          roles: ["platform-tenant"],
          ...(claims.email ? { email: claims.email } : {})
        },
        databaseName,
        tenantId: claims.tenantId ?? ""
      };
    },
    authorize: ({ context, request }) =>
      authorizeCoreRequest(request, context.databaseName, context.actor.email ?? "")
  });
}

export type CoreHostRequestContext = {
  actor: {
    email?: string;
    id: string;
    permissions: readonly string[];
    roles: readonly string[];
  };
  database?: Kysely<CoreDatabase>;
  databaseName: string;
  tenantId: string;
};

export type CoreHostAdapter = {
  authorize?(input: {
    context: CoreHostRequestContext;
    request: FastifyRequest;
  }): Promise<void> | void;
  resolve(request: FastifyRequest): Promise<CoreHostRequestContext> | CoreHostRequestContext;
};

export async function registerCoreApiForHost(app: FastifyInstance, adapter: CoreHostAdapter) {
  await app.register(async (coreApp) => {
    const contexts = new WeakMap<FastifyRequest, CoreHostRequestContext>();
    coreApp.addHook("onRequest", (request, _reply, done) => {
      void Promise.resolve(adapter.resolve(request))
        .then((context) => {
          context.databaseName = resolveCoreDatabaseName(context.databaseName);
          contexts.set(request, context);
          runWithCoreDatabase(context.databaseName, done, context.database);
        })
        .catch((error: unknown) => done(error as Error));
    });
    coreApp.addHook("preHandler", async (request) => {
      const context = contexts.get(request);
      if (!context) throw new Error("Core host request context is unavailable.");
      await bootstrapCoreDatabase(context.databaseName, context.database);
      if (adapter.authorize) {
        await adapter.authorize({ context, request });
      } else {
        authorizeCorePrincipal(request, context.actor);
      }
    });
    await commonModule.register(coreApp);
    await organisationModule.register(coreApp);
    await masterModule.register(coreApp);
  });
}
