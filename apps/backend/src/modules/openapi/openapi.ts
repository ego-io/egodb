import { injectSpaceMemberService, type ISpaceMemberService } from "@undb/authz"
import { type IBaseRepository, injectBaseRepository } from "@undb/base"
import {
  BulkDeleteRecordsCommand,
  BulkDuplicateRecordsCommand,
  BulkUpdateRecordsCommand,
  CreateRecordCommand,
  CreateRecordsCommand,
  DeleteRecordCommand,
  DuplicateRecordCommand,
  UpdateRecordCommand,
} from "@undb/commands"
import { executionContext, getCurrentUserId, setContextValue } from "@undb/context/server"
import { CommandBus, QueryBus } from "@undb/cqrs"
import { inject, singleton } from "@undb/di"
import { type ICommandBus, type IQueryBus, PaginatedDTO, Some } from "@undb/domain"
import { createLogger } from "@undb/logger"
import {
  API_TOKEN_HEADER_NAME,
  createOpenApiSpec,
  type IApiTokenService,
  injectApiTokenService,
  ViewsOpenApi,
} from "@undb/openapi"
import { injectQueryBuilder, type IQueryBuilder } from "@undb/persistence"
import { GetReadableRecordByIdQuery, GetReadableRecordsQuery } from "@undb/queries"
import { injectSpaceService, type ISpaceService } from "@undb/space"
import {
  injectRecordsQueryService,
  injectTableRepository,
  type IRecordReadableValueDTO,
  type IRecordsQueryService,
  type ITableRepository,
  withUniqueTable,
} from "@undb/table"
import { injectUserService, type IUserService } from "@undb/user"
import Elysia, { t } from "elysia"
import { withTransaction } from "../../db"

@singleton()
export class OpenAPI {
  private readonly logger = createLogger(OpenAPI.name)

  constructor(
    @injectBaseRepository()
    private readonly baseRepo: IBaseRepository,
    @injectTableRepository()
    private readonly repo: ITableRepository,
    @injectRecordsQueryService()
    private readonly recordsQueryService: IRecordsQueryService,

    @inject(QueryBus)
    private readonly queryBus: IQueryBus,

    @inject(CommandBus)
    private readonly commandBus: ICommandBus,
    @injectQueryBuilder()
    private readonly qb: IQueryBuilder,
    @injectApiTokenService()
    private readonly apiTokenService: IApiTokenService,
    @injectUserService()
    private readonly userService: IUserService,
    @injectSpaceMemberService()
    private spaceMemberService: ISpaceMemberService,
    @injectSpaceService()
    private spaceService: ISpaceService,
  ) {}

  async getSpec(baseName: string, tableName: string) {
    const ts = withUniqueTable({ baseName, tableName }).unwrap()
    const table = (await this.repo.findOne(Some(ts))).expect("Table not found")
    const base = (await this.baseRepo.findOneById(table.baseId)).expect("Base not found")
    const record = (
      await this.recordsQueryService.getReadableRecords({
        tableId: table.id.value,
        pagination: { limit: 1 },
        ignoreView: true,
      })
    ).values.at(0)

    const viewsOpenApi: ViewsOpenApi[] = []
    const views = table.views.views

    for (const view of views) {
      const viewRecord = (
        await this.recordsQueryService.getReadableRecords({
          tableId: table.id.value,
          pagination: { limit: 1 },
          viewId: view.id.value,
        })
      ).values.at(0)
      viewsOpenApi.push({ view, record: viewRecord })
    }

    const spec = createOpenApiSpec(base, table, record, viewsOpenApi)
    return spec
  }

  public route() {
    return new Elysia({ prefix: "/api/bases/:baseName/tables/:tableName" })
      .onAfterResponse((ctx) => {
        const requestId = executionContext.getStore()?.requestId
        this.logger.info(
          {
            method: ctx.request.method,
            params: ctx.params,
            query: ctx.query,
            path: ctx.path,
            requestId,
          },
          "openapi request",
        )
      })
      .get(
        "/",
        async (ctx) => {
          const spec = await this.getSpec(ctx.params.baseName, ctx.params.tableName)

          return `<html>
              <head>
                <title>Scalar API Reference</title>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
              </head>
              <body>
                <script id="api-reference" type="application/json">
                  ${JSON.stringify(spec)}
                </script>
                <script>
                  var configuration = {
                    theme: 'default',
                    layout: 'classic',
                  }

                  document.getElementById('api-reference').dataset.configuration =
                    JSON.stringify(configuration)
                </script>

                <script src="/assets/api-reference.js"></script>
              </body>
            </html>`
        },
        {
          params: t.Object({ baseName: t.String(), tableName: t.String() }),
          detail: {
            tags: ["Doc"],
            summary: "Get OpenAPI documentation for a table",
            description: "Get OpenAPI documentation for a table",
          },
        },
      )
      .guard({
        beforeHandle: async (context) => {
          const apiToken =
            context.headers[API_TOKEN_HEADER_NAME] ?? context.headers[API_TOKEN_HEADER_NAME.toLowerCase()]

          this.logger.debug({ apiToken }, "Checking Authorization token in openapi")

          if (apiToken) {
            const userId = await this.apiTokenService.verify(apiToken)
            if (userId.isSome()) {
              const user = (await this.userService.findOneById(userId.unwrap())).unwrap()
              const space = await this.spaceService.setSpaceContext(setContextValue, { apiToken })
              await this.spaceMemberService.setSpaceMemberContext(setContextValue, space.id.value, user.id)

              return
            }
          } else {
            const userId = getCurrentUserId()

            if (userId) {
              return
            } else {
              this.logger.error("No api token found in openapi")
            }
          }

          // throw 401 openapi error
          context.set.status = 401
          throw new Error("Unauthorized")
        },
      })
      .get(
        "/openapi.json",
        async (ctx) => {
          const spec = await this.getSpec(ctx.params.baseName, ctx.params.tableName)
          return spec
        },
        {
          params: t.Object({ baseName: t.String(), tableName: t.String() }),
          detail: {
            tags: ["Doc"],
            summary: "Get OpenAPI documentation json spec for a table",
            description: "Get OpenAPI documentation json spec for a table",
          },
        },
      )
      .group("", (app) => {
        return app
          .get(
            "/records",
            async (ctx) => {
              const { baseName, tableName } = ctx.params
              const result = (await this.queryBus.execute(
                new GetReadableRecordsQuery({ baseName, tableName, ignoreView: true }),
              )) as PaginatedDTO<IRecordReadableValueDTO>
              return {
                total: result.total,
                records: result.values,
              }
            },
            {
              params: t.Object({ baseName: t.String(), tableName: t.String() }),
              detail: {
                tags: ["Record"],
                summary: "Get records",
                description: "Get records",
              },
            },
          )
          .get(
            "/views/:viewName/records",
            async (ctx) => {
              const { baseName, tableName, viewName } = ctx.params
              const result = (await this.queryBus.execute(
                new GetReadableRecordsQuery({ baseName, tableName, viewName }),
              )) as PaginatedDTO<IRecordReadableValueDTO>
              return {
                total: result.total,
                records: result.values,
              }
            },
            {
              params: t.Object({ baseName: t.String(), tableName: t.String(), viewName: t.String() }),
              detail: {
                tags: ["Record"],
                summary: "Get records by view id",
                description: "Get records by view id",
              },
            },
          )
          .get(
            "/views/:viewName/records/:recordId",
            async (ctx) => {
              const { baseName, tableName, viewName, recordId } = ctx.params
              const result = await this.queryBus.execute(
                new GetReadableRecordByIdQuery({ baseName, tableName, viewName, id: recordId }),
              )
              return {
                data: result,
              }
            },
            {
              params: t.Object({
                baseName: t.String(),
                tableName: t.String(),
                viewName: t.String(),
                recordId: t.String(),
              }),
              detail: {
                tags: ["Record"],
                summary: "Get record by id in view",
                description: "Get record by id in view",
              },
            },
          )
          .get(
            "/records/:recordId",
            async (ctx) => {
              const { baseName, tableName } = ctx.params
              const result = await this.queryBus.execute(
                new GetReadableRecordByIdQuery({ baseName, tableName, id: ctx.params.recordId, ignoreView: true }),
              )
              return {
                data: result,
              }
            },
            {
              params: t.Object({ baseName: t.String(), tableName: t.String(), recordId: t.String() }),
              detail: {
                tags: ["Record"],
                summary: "Get record by id",
                description: "Get record by id",
              },
            },
          )
          .post(
            "/records",
            async (ctx) => {
              const { baseName, tableName } = ctx.params
              return withTransaction(this.qb)(() =>
                this.commandBus.execute(new CreateRecordCommand({ baseName, tableName, values: ctx.body.values })),
              )
            },
            {
              params: t.Object({ baseName: t.String(), tableName: t.String() }),
              body: t.Object({ values: t.Record(t.String(), t.Any()) }),
              detail: {
                tags: ["Record"],
                summary: "Create record",
                description: "Create record",
              },
            },
          )
          .post(
            "/records/bulk",
            async (ctx) => {
              const { baseName, tableName } = ctx.params
              return withTransaction(this.qb)(() =>
                this.commandBus.execute(new CreateRecordsCommand({ baseName, tableName, records: ctx.body.records })),
              )
            },
            {
              params: t.Object({ baseName: t.String(), tableName: t.String() }),
              body: t.Object({ records: t.Array(t.Object({ id: t.Optional(t.String()), values: t.Any() })) }),
              detail: {
                tags: ["Record"],
                summary: "Create records",
                description: "Create records",
              },
            },
          )
          .patch(
            "/records/:recordId",
            async (ctx) => {
              const { baseName, tableName } = ctx.params
              return withTransaction(this.qb)(() =>
                this.commandBus.execute(
                  new UpdateRecordCommand({
                    tableName,
                    baseName,
                    id: ctx.params.recordId,
                    values: ctx.body.values,
                  }),
                ),
              )
            },
            {
              params: t.Object({ baseName: t.String(), tableName: t.String(), recordId: t.String() }),
              body: t.Object({ values: t.Record(t.String(), t.Any()) }),
              detail: {
                tags: ["Record"],
                summary: "Update record by id",
                description: "Update record by id",
              },
            },
          )
          .patch(
            "/records",
            async (ctx) => {
              const { tableName, baseName } = ctx.params
              return withTransaction(this.qb)(() =>
                this.commandBus.execute(
                  new BulkUpdateRecordsCommand({
                    tableName,
                    baseName,
                    filter: ctx.body.filter,
                    values: ctx.body.values,
                    isOpenapi: true,
                  }),
                ),
              )
            },
            {
              params: t.Object({ baseName: t.String(), tableName: t.String() }),
              body: t.Object({
                filter: t.Any(),
                values: t.Record(t.String(), t.Any()),
              }),
              detail: {
                tags: ["Record"],
                summary: "Update records",
                description: "Update records",
              },
            },
          )
          .post(
            "/records/:recordId/duplicate",
            async (ctx) => {
              const { baseName, tableName } = ctx.params
              return withTransaction(this.qb)(() =>
                this.commandBus.execute(new DuplicateRecordCommand({ baseName, tableName, id: ctx.params.recordId })),
              )
            },
            {
              params: t.Object({ baseName: t.String(), tableName: t.String(), recordId: t.String() }),
              detail: {
                tags: ["Record"],
                summary: "Duplicate record by id",
                description: "Duplicate record by id",
              },
            },
          )
          .post(
            "/records/duplicate",
            async (ctx) => {
              const { baseName, tableName } = ctx.params
              return withTransaction(this.qb)(() =>
                this.commandBus.execute(
                  new BulkDuplicateRecordsCommand({
                    baseName,
                    tableName,
                    filter: ctx.body.filter,
                    isOpenapi: true,
                  }),
                ),
              )
            },
            {
              params: t.Object({ baseName: t.String(), tableName: t.String() }),
              body: t.Object({ filter: t.Any() }),
              detail: {
                tags: ["Record"],
                summary: "Duplicate records",
                description: "Duplicate records",
              },
            },
          )
          .delete(
            "/records/:recordId",
            async (ctx) => {
              const { baseName, tableName } = ctx.params
              return withTransaction(this.qb)(() =>
                this.commandBus.execute(new DeleteRecordCommand({ baseName, tableName, id: ctx.params.recordId })),
              )
            },
            {
              params: t.Object({ baseName: t.String(), tableName: t.String(), recordId: t.String() }),
              detail: {
                tags: ["Record"],
                summary: "Delete record by id",
                description: "Delete record by id",
              },
            },
          )
          .delete(
            "/records",
            async (ctx) => {
              const { baseName, tableName } = ctx.params
              return withTransaction(this.qb)(() =>
                this.commandBus.execute(
                  new BulkDeleteRecordsCommand({
                    baseName,
                    tableName,
                    filter: ctx.body.filter,
                    isOpenapi: true,
                  }),
                ),
              )
            },
            {
              params: t.Object({ baseName: t.String(), tableName: t.String() }),
              body: t.Object({ filter: t.Any() }),
              detail: {
                tags: ["Record"],
                summary: "Delete records",
                description: "Delete records",
              },
            },
          )
      })
  }
}
