import type { Base, IBaseSpecVisitor, WithBaseId, WithBaseName, WithBaseQ, WithBaseSpaceId } from "@undb/base"
import type { DuplicatedBaseSpecification } from "@undb/base/src/specifications/base.specification"
import { mustGetCurrentSpaceId } from "@undb/context/server"
import type { ExpressionBuilder } from "kysely"
import { AbstractQBVisitor } from "../abstract-qb.visitor"
import type { Database } from "../db"

export class BaseFilterVisitor extends AbstractQBVisitor<Base> implements IBaseSpecVisitor {
  constructor(protected readonly eb: ExpressionBuilder<Database, "undb_base">) {
    super(eb)
    const spaceId = mustGetCurrentSpaceId()
    this.addCond(this.eb.eb("space_id", "=", spaceId))
  }

  duplicatedBase(v: DuplicatedBaseSpecification): void {
    throw new Error("Not implemented")
  }
  withId(v: WithBaseId): void {
    this.addCond(this.eb.eb("id", "=", v.id.value))
  }
  withBaseSpaceId(v: WithBaseSpaceId): void {
    this.addCond(this.eb.eb("space_id", "=", v.spaceId))
  }
  withName(v: WithBaseName): void {
    this.addCond(this.eb.eb("name", "=", v.name.value))
  }
  withQ(v: WithBaseQ): void {
    this.addCond(this.eb.eb("name", "like", `%${v.q}%`))
  }
}
