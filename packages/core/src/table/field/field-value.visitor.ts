import type { AttachmentFieldValue } from './attachment-field-value.js'
import type { AutoIncrementFieldValue } from './auto-increment-field-value.js'
import type { AverageFieldValue } from './average-field-value.js'
import type { BoolFieldValue } from './bool-field-value.js'
import type { ColorFieldValue } from './color-field-value.js'
import type { CountFieldValue } from './count-field-value.js'
import type { CreatedAtFieldValue } from './created-at-field-value.js'
import type { DateFieldValue } from './date-field-value.js'
import type { DateRangeFieldValue } from './date-range-field-value.js'
import type { EmailFieldValue } from './email-field-value.js'
import type { IdFieldValue } from './id-field-value.js'
import type { LookupFieldValue } from './lookup-field-value.js'
import type { NumberFieldValue } from './number-field-value.js'
import type { ParentFieldValue } from './parent-field-value.js'
import type { RatingFieldValue } from './rating-field-value.js'
import type { ReferenceFieldValue } from './reference-field-value.js'
import type { SelectFieldValue } from './select-field-value.js'
import type { StringFieldValue } from './string-field-value.js'
import type { SumFieldValue } from './sum-field-value.js'
import type { TreeFieldValue } from './tree-field-value.js'
import type { UpdatedAtFieldValue } from './updated-at-field-value.js'

export interface IFieldValueVisitor {
  id(value: IdFieldValue): void
  createdAt(value: CreatedAtFieldValue): void
  updatedAt(value: UpdatedAtFieldValue): void
  attachment(value: AttachmentFieldValue): void
  autoIncrement(value: AutoIncrementFieldValue): void
  string(value: StringFieldValue): void
  email(value: EmailFieldValue): void
  color(value: ColorFieldValue): void
  number(value: NumberFieldValue): void
  bool(value: BoolFieldValue): void
  date(value: DateFieldValue): void
  dateRange(value: DateRangeFieldValue): void
  select(value: SelectFieldValue): void
  reference(value: ReferenceFieldValue): void
  tree(value: TreeFieldValue): void
  parent(value: ParentFieldValue): void
  rating(value: RatingFieldValue): void
  count(value: CountFieldValue): void
  sum(value: SumFieldValue): void
  average(value: AverageFieldValue): void
  lookup(value: LookupFieldValue): void
}
