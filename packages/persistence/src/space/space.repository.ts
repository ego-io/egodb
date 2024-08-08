import { getCurrentUserId } from "@undb/context/server"
import { singleton } from "@undb/di"
import { None, Some, type Option } from "@undb/domain"
import { SpaceFactory, type ISpaceRepository, type ISpaceSpecification, type Space } from "@undb/space"
import { getCurrentTransaction } from "../ctx"
import type { IQueryBuilder } from "../qb"
import { injectQueryBuilder } from "../qb.provider"
import { SpaceFilterVisitor } from "./space.filter-visitor"
import { SpaceMutateVisitor } from "./space.mutate-visitor"

@singleton()
export class SpaceRepostitory implements ISpaceRepository {
  constructor(
    @injectQueryBuilder()
    private readonly qb: IQueryBuilder,
  ) {}
  async find(spec: ISpaceSpecification): Promise<Space[]> {
    const space = await (getCurrentTransaction() ?? this.qb)
      .selectFrom("undb_space")
      .selectAll()
      .where((eb) => {
        const visitor = new SpaceFilterVisitor(this.qb, eb)
        spec.accept(visitor)
        return visitor.cond
      })
      .execute()

    return space.map((s) =>
      SpaceFactory.fromJSON({
        id: s.id,
        name: s.name ?? "",
        avatar: s.avatar,
        isPersonal: Boolean(s.is_personal),
      }),
    )
  }
  async findOne(spec: ISpaceSpecification): Promise<Option<Space>> {
    const space = await (getCurrentTransaction() ?? this.qb)
      .selectFrom("undb_space")
      .selectAll()
      .where((eb) => {
        const visitor = new SpaceFilterVisitor(this.qb, eb)
        spec.accept(visitor)
        return visitor.cond
      })
      .executeTakeFirst()

    if (!space) {
      return None
    }

    return Some(
      SpaceFactory.fromJSON({
        id: space.id,
        name: space.name ?? "",
        avatar: space.avatar,
        isPersonal: Boolean(space.is_personal),
      }),
    )
  }
  async findOneById(id: string): Promise<Option<Space>> {
    const space = await (getCurrentTransaction() ?? this.qb)
      .selectFrom("undb_space")
      .selectAll()
      .where("undb_space.id", "=", id)
      .where("undb_space.deleted_at", "is", null)
      .executeTakeFirst()

    if (!space) {
      return None
    }

    return Some(
      SpaceFactory.fromJSON({
        id: space.id,
        avatar: space.avatar,
        name: space.name ?? "",
        isPersonal: Boolean(space.is_personal),
      }),
    )
  }
  async insert(space: Space): Promise<void> {
    const tx = getCurrentTransaction()
    const userId = getCurrentUserId()
    await tx
      .insertInto("undb_space")
      .values({
        id: space.id.value,
        name: space.name.value,
        avatar: space.avatar.into(undefined)?.value ?? null,
        is_personal: space.isPersonal,
        created_by: userId,
        updated_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .execute()
  }
  async updateOneById(space: Space, spec: ISpaceSpecification): Promise<void> {
    const visitor = new SpaceMutateVisitor()
    spec.accept(visitor)

    const userId = getCurrentUserId()
    await getCurrentTransaction()
      .updateTable("undb_space")
      .set({ ...visitor.data, updated_by: userId, updated_at: new Date().toISOString() })
      .where((eb) => eb.and([eb.eb("id", "=", space.id.value), eb.eb("deleted_at", "is", null)]))
      .execute()
  }
  async deleteOneById(id: string): Promise<void> {
    const tx = getCurrentTransaction()

    await tx
      .updateTable("undb_space")
      .set({ deleted_at: new Date().getTime(), deleted_by: getCurrentUserId() })
      .where("id", "=", id)
      .execute()
  }
}
