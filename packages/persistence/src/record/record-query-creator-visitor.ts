import {
  ID_TYPE,
  type AutoIncrementField,
  type CreatedAtField,
  type CreatedByField,
  type Field,
  type IFieldVisitor,
  type IdField,
  type NumberField,
  type ReferenceField,
  type RollupField,
  type StringField,
  type TableDo,
  type UpdatedAtField,
  type UpdatedByField,
} from "@undb/table"
import type { QueryCreator } from "kysely"
import type { IQueryBuilder } from "../qb"
import { JoinTable } from "../underlying/reference/join-table"
import { UnderlyingTable } from "../underlying/underlying-table"

export class RecordQueryCreatorVisitor implements IFieldVisitor {
  constructor(
    private readonly qb: IQueryBuilder,
    private readonly table: TableDo,
    private readonly foreignTables: Map<string, TableDo>,
    private readonly fields: Field[],
  ) {}

  private creator: QueryCreator<any> | null = null

  create() {
    // handle select fields
    const referenceFields = this.table.schema.getReferenceFields(this.fields)
    for (const referenceField of referenceFields) {
      referenceField.accept(this)
    }
    return this.creator ?? this.qb
  }

  id(field: IdField): void {}
  autoIncrement(field: AutoIncrementField): void {}
  createdAt(field: CreatedAtField): void {}
  createdBy(field: CreatedByField): void {}
  updatedAt(field: UpdatedAtField): void {}
  updatedBy(field: UpdatedByField): void {}
  string(field: StringField): void {}
  number(field: NumberField): void {}
  reference(field: ReferenceField): void {
    const foreignTable = this.foreignTables.get(field.foreignTableId)
    if (!foreignTable) {
      return
    }

    const displayFields = foreignTable.schema.getDisplayFields()
    const rollupFields = field.getRollupFields(this.fields)

    const underlyingForiegnTable = new UnderlyingTable(foreignTable)

    const joinTable = new JoinTable(this.table, field)
    const name = joinTable.getTableName()
    const valueField = joinTable.getValueFieldId()
    const symmetricField = joinTable.getSymmetricValueFieldId()

    this.creator = (this.creator || this.qb).with(field.id.value, (db) =>
      db
        .selectFrom(name)
        .innerJoin(
          underlyingForiegnTable.name,
          `${name}.${symmetricField}`,
          `${underlyingForiegnTable.name}.${ID_TYPE}`,
        )
        .select((sb) => [
          `${name}.${valueField} as ${ID_TYPE}`,
          sb.fn("json_group_array", [sb.ref(`${name}.${symmetricField}`)]).as(field.id.value),
          // select display fields for reference
          ...displayFields.map((f) =>
            sb.fn("json_group_array", [sb.ref(`${underlyingForiegnTable.name}.${f.id.value}`)]).as(f.id.value),
          ),
        ])
        .groupBy(`${name}.${valueField}`),
    )
  }
  rollup(field: RollupField): void {}
}
