import { DeleteSpaceCommand } from "@undb/commands"
import { getCurrentUserId } from "@undb/context/server"
import { CommandBus } from "@undb/cqrs"
import { inject, singleton } from "@undb/di"
import { injectQueryBuilder, type IQueryBuilder } from "@undb/persistence"
import { injectSpaceService, type ISpaceService } from "@undb/space"
import Elysia, { t } from "elysia"
import { type Lucia } from "lucia"
import { withTransaction } from "../../db"
import { injectLucia } from "../auth/auth.provider"

@singleton()
export class SpaceModule {
  constructor(
    @injectLucia()
    private readonly lucia: Lucia,
    @injectSpaceService()
    private readonly spaceService: ISpaceService,
    @inject(CommandBus)
    private readonly commandBus: CommandBus,
    @injectQueryBuilder()
    private readonly qb: IQueryBuilder,
  ) {}
  public route() {
    return new Elysia()
      .get(
        "/api/spaces/:spaceId/goto",
        async (ctx) => {
          const { spaceId } = ctx.params
          const space = (await this.spaceService.getSpace({ spaceId })).expect("Space not found")

          const cookieHeader = ctx.request.headers.get("Cookie") ?? ""
          const sessionId = this.lucia.readSessionCookie(cookieHeader)

          if (!sessionId) {
            return new Response("Unauthorized", { status: 401 })
          }

          const { session, user } = await this.lucia.validateSession(sessionId)
          if (!user) {
            return new Response(null, {
              status: 401,
            })
          }
          await this.lucia.invalidateUserSessions(user.id)
          const updatedSession = await this.lucia.createSession(user.id, { space_id: space.id.value })
          const sessionCookie = this.lucia.createSessionCookie(updatedSession.id)
          return new Response(null, {
            status: 302,
            headers: {
              Location: "/",
              "Set-Cookie": sessionCookie.serialize(),
            },
          })
        },
        {
          params: t.Object({
            spaceId: t.String(),
          }),
        },
      )
      .delete("/api/space", async (ctx) => {
        return withTransaction(this.qb)(async () => {
          await this.commandBus.execute(new DeleteSpaceCommand({}))

          const userId = getCurrentUserId()

          await this.lucia.invalidateSession(userId)
          const space = (await this.spaceService.getSpace({ userId })).expect("Space not found")

          const updatedSession = await this.lucia.createSession(userId, { space_id: space.id.value })
          const sessionCookie = this.lucia.createSessionCookie(updatedSession.id)
          return new Response(null, {
            status: 200,
            headers: {
              Location: "/",
              "Set-Cookie": sessionCookie.serialize(),
            },
          })
        })
      })
  }
}
