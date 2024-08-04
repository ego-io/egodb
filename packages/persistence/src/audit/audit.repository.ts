import type { Audit, AuditSpecification, IAuditRepository } from "@undb/audit"
import { getCurrentUserId, mustGetCurrentSpaceId } from "@undb/context/server"
import { inject, singleton } from "@undb/di"
import type { Option } from "@undb/domain"
import type { IQueryBuilder } from "../qb"
import { injectQueryBuilder } from "../qb.provider"
import { AuditMapper } from "./audit.mapper"

@singleton()
export class AuditRepository implements IAuditRepository {
  constructor(
    @inject(AuditMapper)
    private readonly mapper: AuditMapper,
    @injectQueryBuilder()
    private readonly qb: IQueryBuilder,
  ) {}
  findOne(spec: AuditSpecification): Promise<Option<Audit>> {
    throw new Error("Method not implemented.")
  }
  async insert(audit: Audit): Promise<void> {
    const user = getCurrentUserId()
    const values = this.mapper.toEntity(audit)

    await this.qb
      .insertInto("undb_audit")
      .values({
        ...values,
        space_id: mustGetCurrentSpaceId(),
        operator_id: user,
      })
      .execute()
  }
  updateOneById(id: string, spec: AuditSpecification): Promise<void> {
    throw new Error("Method not implemented.")
  }
  deleteOneById(id: string): Promise<void> {
    throw new Error("Method not implemented.")
  }
}
