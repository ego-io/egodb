import { mustGetCurrentSpaceId } from "@undb/context/server"
import type {
  IShareSpecVisitor,
  Share,
  WithShareBase,
  WithShareEnabled,
  WithShareForm,
  WithShareId,
  WithShareTable,
  WithShareView,
} from "@undb/share"
import type { ExpressionBuilder } from "kysely"
import { AbstractQBVisitor } from "../abstract-qb.visitor"
import type { Database } from "../db"

export class ShareFilterVisitor extends AbstractQBVisitor<Share> implements IShareSpecVisitor {
  constructor(protected readonly eb: ExpressionBuilder<Database, "undb_share">) {
    super(eb)
    const spaceId = mustGetCurrentSpaceId()
    this.addCond(this.eb.eb("space_id", "=", spaceId))
  }
  idEqual(s: WithShareId): void {
    this.addCond(this.eb.eb("id", "=", s.shareId.value))
  }
  targetTable(s: WithShareTable): void {
    const cond = this.eb.and([this.eb.eb("target_type", "=", "table"), this.eb.eb("target_id", "=", s.tableId)])
    this.addCond(cond)
  }
  targetBase(s: WithShareBase): void {
    const cond = this.eb.and([this.eb.eb("target_type", "=", "base"), this.eb.eb("target_id", "=", s.baseId)])
    this.addCond(cond)
  }
  targetView(s: WithShareView): void {
    const cond = this.eb.and([this.eb.eb("target_type", "=", "view"), this.eb.eb("target_id", "=", s.viewId)])
    this.addCond(cond)
  }
  targetForm(s: WithShareForm): void {
    const cond = this.eb.and([this.eb.eb("target_type", "=", "form"), this.eb.eb("target_id", "=", s.formId)])
    this.addCond(cond)
  }
  enabled(s: WithShareEnabled): void {
    const cond = this.eb.eb("enabled", "=", s.enabled)
    this.addCond(cond)
  }
}
