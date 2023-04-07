import { CompositeSpecification } from '@egodb/domain'
import type { Result } from 'oxide.ts'
import { Ok } from 'oxide.ts'
import type { ITableSpecVisitor } from '../../specifications/index.js'
import type { Table } from '../../table.js'
import type { IAbstractLookupField } from '../field.type.js'
import { FieldId } from '../value-objects/index.js'

export class WithReferenceFieldId extends CompositeSpecification<Table, ITableSpecVisitor> {
  constructor(private readonly field: IAbstractLookupField, private readonly referenceFieldId: FieldId) {
    super()
  }

  static fromString(field: IAbstractLookupField, fieldId: string) {
    return new this(field, FieldId.fromString(fieldId))
  }

  isSatisfiedBy(t: Table): boolean {
    return this.referenceFieldId.equals(this.field.referenceFieldId)
  }
  mutate(t: Table): Result<Table, string> {
    this.field.referenceFieldId = this.referenceFieldId
    return Ok(t)
  }
  accept(v: ITableSpecVisitor): Result<void, string> {
    return Ok(undefined)
  }
}
