import type { AttachmentField } from './attachment-field.js'
import type { AutoIncrementField } from './auto-increment-field.js'
import type { AverageField } from './average-field.js'
import type { BoolField } from './bool-field.js'
import type { ColorField } from './color-field.js'
import type { CountField } from './count-field.js'
import type { CreatedAtField } from './created-at-field.js'
import type { DateField } from './date-field.js'
import type { DateRangeField } from './date-range-field.js'
import type { EmailField } from './email-field.js'
import type { IdField } from './id-field.js'
import type { LookupField } from './lookup-field.js'
import type { NumberField } from './number-field.js'
import type { ParentField } from './parent-field.js'
import type { RatingField } from './rating-field.js'
import type { ReferenceField } from './reference-field.js'
import type { SelectField } from './select-field.js'
import type { StringField } from './string-field.js'
import type { SumField } from './sum-field.js'
import type { TreeField } from './tree-field.js'
import type { UpdatedAtField } from './updated-at-field.js'

export interface IFieldVisitor {
  id(field: IdField): void
  createdAt(field: CreatedAtField): void
  updatedAt(field: UpdatedAtField): void
  attachment(field: AttachmentField): void
  autoIncrement(field: AutoIncrementField): void
  string(field: StringField): void
  email(field: EmailField): void
  color(field: ColorField): void
  number(field: NumberField): void
  bool(field: BoolField): void
  date(field: DateField): void
  dateRange(field: DateRangeField): void
  select(field: SelectField): void
  reference(field: ReferenceField): void
  tree(field: TreeField): void
  parent(field: ParentField): void
  rating(field: RatingField): void
  count(field: CountField): void
  sum(field: SumField): void
  average(field: AverageField): void
  lookup(field: LookupField): void
}
