import { executionContext, getCurrentSpaceId } from "@undb/context/server"
import { inject, singleton } from "@undb/di"
import { None, Option, Some } from "@undb/domain"
import {
  TableComositeSpecification,
  TableIdSpecification,
  TableIdsSpecification,
  injectTableOutboxService,
  type ITableOutboxService,
  type ITableRepository,
  type TableDo,
  type TableId,
} from "@undb/table"
import { getCurrentTransaction } from "../ctx"
import type { InsertTable, InsertTableIdMapping } from "../db"
import { json, type IQueryBuilder } from "../qb"
import { injectQueryBuilder } from "../qb.provider"
import { UnderlyingTableService } from "../underlying/underlying-table.service"
import { TableDbQuerySpecHandler } from "./table-db.query-spec-handler"
import { TableMapper } from "./table.mapper"
import { TableMutationVisitor } from "./table.mutation-visitor"
import { TableReferenceVisitor } from "./table.reference-visitor"

@singleton()
export class TableRepository implements ITableRepository {
  constructor(
    @inject(UnderlyingTableService)
    private readonly underlyingTableService: UnderlyingTableService,
    @injectTableOutboxService()
    private readonly outboxService: ITableOutboxService,
    @injectQueryBuilder()
    private readonly qb: IQueryBuilder,
  ) {}

  get mapper() {
    return new TableMapper()
  }

  async updateOneById(table: TableDo, spec: Option<TableComositeSpecification>): Promise<void> {
    return this.#updateOneById(table, spec)
  }

  async #updateOneById(table: TableDo, spec: Option<TableComositeSpecification>): Promise<void> {
    if (spec.isNone()) {
      return
    }

    const trx = getCurrentTransaction()

    const ctx = executionContext.getStore()
    const userId = ctx!.user!.userId!

    const visitor = new TableMutationVisitor(table, trx)
    spec.unwrap().accept(visitor)

    await trx
      .updateTable("undb_table")
      .set({ ...visitor.data, updated_by: userId, updated_at: new Date().toISOString() })
      .where((eb) => eb.eb("id", "=", table.id.value))
      .execute()
    for (const sql of visitor.sql) {
      await trx.executeQuery(sql)
    }
    await this.underlyingTableService.update(table, spec.unwrap())
    await this.outboxService.save(table)
  }

  async insert(table: TableDo): Promise<void> {
    const trx = getCurrentTransaction()
    const ctx = executionContext.getStore()
    const userId = ctx!.user!.userId!

    const spaceId = getCurrentSpaceId()
    if (!spaceId) {
      throw new Error("Space ID is required to create a table")
    }

    const rls = table.rls.into(undefined)
    const values: InsertTable = {
      id: table.id.value,
      name: table.name.value,
      base_id: table.baseId,
      created_by: userId,
      space_id: spaceId,
      created_at: new Date().toISOString(),
      schema: json(table.schema.toJSON()),
      views: json(table.views.toJSON()),
      forms: table.forms ? json(table.forms?.toJSON()) : null,
      rls: rls ? json(rls.toJSON()) : null,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    }

    await trx.insertInto("undb_table").values(values).execute()

    const viewIds = table.views.views.map((v) => v.id.value)
    const formIds = table.forms?.props.map((v) => v.id) ?? []
    const fieldsIds = table.schema.noneSystemFields.map((f) => f.id.value)
    const mapping: InsertTableIdMapping[] = viewIds
      .concat(formIds)
      .concat(fieldsIds)
      .map((id) => ({ table_id: table.id.value, subject_id: id }))
    await trx.insertInto("undb_table_id_mapping").values(mapping).execute()

    await this.underlyingTableService.create(table)
    await this.outboxService.save(table)
  }

  async bulkUpdate(updates: { table: TableDo; spec: Option<TableComositeSpecification> }[]): Promise<void> {
    for (const update of updates) {
      await this.#updateOneById(update.table, update.spec)
    }
  }

  async find(spec: Option<TableComositeSpecification>): Promise<TableDo[]> {
    const tbs = await this.qb
      .selectFrom("undb_table")
      .selectAll()
      .$if(spec.isSome(), (qb) => new TableReferenceVisitor(qb).call(spec.unwrap()))
      .where((eb) => new TableDbQuerySpecHandler(this.qb, eb).handle(spec))
      .execute()

    return tbs.map((t) => this.mapper.toDo(t))
  }

  async findOne(spec: Option<TableComositeSpecification>): Promise<Option<TableDo>> {
    const tb = await this.qb
      .selectFrom("undb_table")
      .selectAll()
      .$if(spec.isSome(), (qb) => new TableReferenceVisitor(qb).call(spec.unwrap()))
      .where((eb) => new TableDbQuerySpecHandler(this.qb, eb).handle(spec))
      .executeTakeFirst()

    if (!tb) {
      return None
    }

    return Some(this.mapper.toDo(tb))
  }

  async findOneById(id: TableId): Promise<Option<TableDo>> {
    const spec = Some(new TableIdSpecification(id))
    const tb = await this.qb
      .selectFrom("undb_table")
      .selectAll()
      .$call((qb) => new TableReferenceVisitor(qb).call(spec.unwrap()))
      .where((eb) => new TableDbQuerySpecHandler(this.qb, eb).handle(spec))
      .executeTakeFirst()

    return tb ? Some(this.mapper.toDo(tb)) : None
  }

  async findManyByIds(ids: TableId[]): Promise<TableDo[]> {
    const spec = Some(new TableIdsSpecification(ids))
    const tbs = await this.qb
      .selectFrom("undb_table")
      .selectAll()
      .$call((qb) => new TableReferenceVisitor(qb).call(spec.unwrap()))
      .where((eb) => new TableDbQuerySpecHandler(this.qb, eb).handle(spec))
      .execute()

    return tbs.map((t) => this.mapper.toDo(t))
  }

  async deleteOneById(table: TableDo): Promise<void> {
    const trx = getCurrentTransaction()
    await trx
      .deleteFrom("undb_table_id_mapping")
      .where((eb) => eb.eb("table_id", "=", table.id.value))
      .execute()

    await trx
      .deleteFrom("undb_rollup_id_mapping")
      .where((eb) => eb.eb("table_id", "=", table.id.value).or(eb.eb("rollup_table_id", "=", table.id.value)))
      .execute()

    await trx
      .deleteFrom("undb_reference_id_mapping")
      .where((eb) => eb.or([eb.eb("table_id", "=", table.id.value), eb.eb("foreign_table_id", "=", table.id.value)]))
      .execute()

    await trx
      .deleteFrom("undb_table")
      .where((eb) => eb.eb("id", "=", table.id.value))
      .execute()

    await this.underlyingTableService.delete(table)
  }
}
