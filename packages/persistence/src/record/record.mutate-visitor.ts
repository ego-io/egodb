import { getCurrentUserId, mustGetCurrentSpaceId } from "@undb/context/server"
import type { ISpecification, ISpecVisitor } from "@undb/domain"
import {
  CurrencyEqual,
  DateIsEmpty,
  ID_TYPE,
  isUserFieldMacro,
  JsonContains,
  LongTextEqual,
  SelectContainsAnyOf,
  SelectField,
  SelectFieldValue,
  UrlEqual,
  UserField,
  UserFieldValue,
  type AttachmentEmpty,
  type AttachmentEqual,
  type CheckboxEqual,
  type DateEqual,
  type DateIsAfter,
  type DateIsBefore,
  type DateIsSameDay,
  type DateIsToday,
  type DateIsTomorrow,
  type EmailEqual,
  type IdEqual,
  type IdIn,
  type IRecordVisitor,
  type JsonEmpty,
  type JsonEqual,
  type NumberEmpty,
  type NumberEqual,
  type NumberGT,
  type NumberGTE,
  type NumberLT,
  type NumberLTE,
  type RatingEqual,
  type RecordDO,
  type ReferenceEqual,
  type ReferenceField,
  type SelectEmpty,
  type SelectEqual,
  type StringContains,
  type StringEmpty,
  type StringEndsWith,
  type StringEqual,
  type StringMax,
  type StringMin,
  type StringStartsWith,
  type TableDo,
  type UserEmpty,
  type UserEqual,
} from "@undb/table"
import { sql, type ExpressionBuilder } from "kysely"
import { AbstractQBMutationVisitor } from "../abstract-qb.visitor"
import type { IQueryBuilder, IRecordQueryBuilder } from "../qb"
import { JoinTable } from "../underlying/reference/join-table"

export class RecordMutateVisitor extends AbstractQBMutationVisitor implements IRecordVisitor {
  constructor(
    private readonly table: TableDo,
    /**
     * if record is null it means we are mutating all records
     */
    private readonly record: RecordDO | null,
    private readonly qb: IRecordQueryBuilder,
    private readonly eb: ExpressionBuilder<any, any>,
  ) {
    super()
  }

  idIn(spec: IdIn): void {
    throw new Error("Method not implemented.")
  }
  checkboxEqual(spec: CheckboxEqual): void {
    this.setData(spec.fieldId.value, spec.value)
  }
  jsonEqual(spec: JsonEqual): void {
    this.setData(spec.fieldId.value, JSON.stringify(spec.json))
  }
  jsonContains(spec: JsonContains): void {
    throw new Error("Method not implemented.")
  }
  jsonEmpty(spec: JsonEmpty): void {
    this.setData(spec.fieldId.value, null)
  }
  dateIsEmpty(spec: DateIsEmpty): void {
    this.setData(spec.fieldId.value, null)
  }
  dateEqual(spec: DateEqual): void {
    this.setData(spec.fieldId.value, spec.date?.getTime() ?? null)
  }
  attachmentEqual(s: AttachmentEqual): void {
    this.setData(s.fieldId.value, JSON.stringify(s.value))
    if (this.record) {
      const deleteSql = (this.qb as IQueryBuilder)
        .deleteFrom("undb_attachment_mapping")
        .where((eb) =>
          eb.and([
            eb.eb("undb_attachment_mapping.table_id", "=", this.table.id.value),
            eb.eb("undb_attachment_mapping.field_id", "=", s.fieldId.value),
            eb.eb("undb_attachment_mapping.record_id", "=", this.record!.id.value),
          ]),
        )
        .compile()
      this.addSql(deleteSql)

      if (s.value?.length) {
        const userId = getCurrentUserId()
        const spaceId = mustGetCurrentSpaceId()
        const insert = (this.qb as IQueryBuilder)
          .insertInto("undb_attachment")
          .values(
            s.value!.map((value) => {
              return {
                size: value.size,
                url: value.url,
                created_at: new Date().getTime(),
                created_by: userId,
                space_id: spaceId,
                id: value.id,
                mime_type: value.type,
                name: value.name,
              }
            }),
          )
          .onConflict((bd) => bd.columns(["id"]).doNothing())
          .compile()
        this.addSql(insert)

        const insertSql = (this.qb as IQueryBuilder)
          .insertInto("undb_attachment_mapping")
          .values(
            s.value?.map((value) => ({
              table_id: this.table.id.value,
              field_id: s.fieldId.value,
              record_id: this.record!.id.value,
              attachment_id: value.id,
            })),
          )
          .onConflict((bd) => bd.columns(["table_id", "field_id", "record_id", "attachment_id"]).doNothing())
          .compile()
        this.addSql(insertSql)
      }
    }
  }
  longTextEqual(s: LongTextEqual): void {
    this.setData(s.fieldId.value, s.value)
  }
  attachmentEmpty(s: AttachmentEmpty): void {
    this.setData(s.fieldId.value, null)
    const deleteSql = (this.qb as IQueryBuilder)
      .deleteFrom("undb_attachment_mapping")
      .where((eb) =>
        eb.and([
          eb.eb("undb_attachment_mapping.table_id", "=", this.table.id.value),
          eb.eb("undb_attachment_mapping.field_id", "=", s.fieldId.value),
          eb.eb("undb_attachment_mapping.record_id", "=", this.record!.id.value),
        ]),
      )
      .compile()
    this.addSql(deleteSql)
  }
  referenceEqual(spec: ReferenceEqual): void {
    const record = this.record
    const field = this.table.schema.getFieldById(spec.fieldId).unwrap() as ReferenceField

    const joinTable = new JoinTable(this.table, field)
    const name = joinTable.getTableName()

    if (!record) {
      const deleteRecords = this.qb.deleteFrom(name).compile()

      this.addSql(deleteRecords)

      const values = spec.values.props

      if (Array.isArray(values) && values.length) {
        const fieldId = joinTable.getValueFieldId()
        const symmetricFieldId = joinTable.getSymmetricValueFieldId()
        const insert = this.qb
          .insertInto(name)
          .columns([fieldId, symmetricFieldId])
          .expression((eb) => {
            const expression = (v: string) =>
              // FIXME: incorrect! should filter by bulk update condition
              eb.selectFrom(this.table.id.value).select([sql.ref(ID_TYPE).as(fieldId), sql.raw(v).as(symmetricFieldId)])

            return values.reduce((prev, value) => prev.unionAll(expression(value)), expression(values[0]))
          })
          .onConflict((bd) => bd.columns([fieldId, symmetricFieldId]).doNothing())
          .compile()
        this.addSql(insert)
      }

      return
    }

    const deleteRecords = this.qb
      .deleteFrom(name)
      .where(this.eb.eb(joinTable.getValueFieldId(), "=", record.id.value))
      .compile()

    this.addSql(deleteRecords)

    const values = spec.values.props

    if (Array.isArray(values) && values.length) {
      const fieldId = joinTable.getValueFieldId()
      const symmetricFieldId = joinTable.getSymmetricValueFieldId()
      const insert = this.qb
        .insertInto(name)
        .values(
          values.map((recordId) => ({
            [fieldId]: record.id.value,
            [symmetricFieldId]: recordId,
          })),
        )
        .onConflict((bd) => bd.columns([fieldId, symmetricFieldId]).doNothing())
        .compile()
      this.addSql(insert)
    }
  }
  userEqual(spec: UserEqual): void {
    const field = this.table.schema
      .getFieldById(spec.fieldId)
      .expect("No field found: " + spec.fieldId.value) as UserField
    const fieldValue = new UserFieldValue(spec.value)
    const value = fieldValue.getValue(field)

    function convertMacro(value: string) {
      if (isUserFieldMacro(value)) {
        if (value === "@me") {
          return getCurrentUserId()
        }
      }

      return value
    }

    if (Array.isArray(value)) {
      const converted = value.map(convertMacro)
      this.setData(spec.fieldId.value, JSON.stringify(converted))
    } else {
      this.setData(spec.fieldId.value, value ? convertMacro(value) : null)
    }
  }
  userEmpty(spec: UserEmpty): void {
    this.setData(spec.fieldId.value, null)
  }
  stringMin(spec: StringMin): void {
    throw new Error("Method not implemented.")
  }
  stringMax(spec: StringMax): void {
    throw new Error("Method not implemented.")
  }
  stringEqual(spec: StringEqual): void {
    this.setData(spec.fieldId.value, spec.values.value)
  }
  stringContains(spec: StringContains): void {
    throw new Error("Method not implemented.")
  }
  stringStartsWith(spec: StringStartsWith): void {
    throw new Error("Method not implemented.")
  }
  stringEndsWith(spec: StringEndsWith): void {
    throw new Error("Method not implemented.")
  }
  stringEmpty(spec: StringEmpty): void {
    throw new Error("Method not implemented.")
  }
  selectEqual(spec: SelectEqual): void {
    const field = this.table.schema.getFieldById(spec.fieldId).expect("No field found") as SelectField
    const fieldValue = new SelectFieldValue(spec.value)
    const value = fieldValue.getValue(field)

    this.setData(spec.fieldId.value, Array.isArray(value) ? JSON.stringify(value) : value)
  }
  selectContainsAnyOf(spec: SelectContainsAnyOf): void {
    throw new Error("Method not implemented.")
  }
  selectEmpty(spec: SelectEmpty): void {
    this.setData(spec.fieldId.value, null)
  }
  numberEqual(spec: NumberEqual): void {
    this.setData(spec.fieldId.value, spec.value)
  }
  numberGT(spec: NumberGT): void {
    throw new Error("Method not implemented.")
  }
  numberGTE(spec: NumberGTE): void {
    throw new Error("Method not implemented.")
  }
  numberLT(spec: NumberLT): void {
    throw new Error("Method not implemented.")
  }
  numberLTE(spec: NumberLTE): void {
    throw new Error("Method not implemented.")
  }
  numberEmpty(spec: NumberEmpty): void {
    throw new Error("Method not implemented.")
  }
  currencyEqual(spec: CurrencyEqual): void {
    this.setData(spec.fieldId.value, spec.value === null ? null : spec.value * 100)
  }
  idEqual(spec: IdEqual): void {
    this.setData(spec.fieldId.value, spec.values.value)
  }
  dateIsSameDate(spec: DateIsSameDay): void {
    throw new Error("Method not implemented.")
  }
  dateIsToday(spec: DateIsToday): void {
    throw new Error("Method not implemented.")
  }
  dateIsTomorrow(spec: DateIsTomorrow): void {
    throw new Error("Method not implemented.")
  }
  dateIsYesterday(spec: DateIsTomorrow): void {
    throw new Error("Method not implemented.")
  }
  dateIsBefore(spec: DateIsBefore): void {
    throw new Error("Method not implemented.")
  }
  dateIsAfter(spec: DateIsAfter): void {
    throw new Error("Method not implemented.")
  }
  ratingEqual(s: RatingEqual): void {
    this.setData(s.fieldId.value, s.value)
  }
  emailEqual(s: EmailEqual): void {
    this.setData(s.fieldId.value, s.value)
  }
  urlEqual(s: UrlEqual): void {
    this.setData(s.fieldId.value, s.value)
  }
  and(left: ISpecification<any, ISpecVisitor>, right: ISpecification<any, ISpecVisitor>): this {
    left.accept(this)
    right.accept(this)
    return this
  }
  or(left: ISpecification<any, ISpecVisitor>, right: ISpecification<any, ISpecVisitor>): this {
    throw new Error("Method not implemented.")
  }
  not(spec: ISpecification<any, ISpecVisitor>): this {
    throw new Error("Method not implemented.")
  }
  clone(): this {
    throw new Error("Method not implemented.")
  }
}
