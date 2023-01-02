import { BoolField } from './bool-field'
import { DateField } from './date-field'
import { DateRangeField } from './date-range-field'
import type { Field, ICreateFieldSchema } from './field.type'
import { NumberField } from './number-field'
import { SelectField } from './select-field'
import { StringField } from './string-field'

export class FieldFactory {
  static create(input: ICreateFieldSchema): Field {
    switch (input.type) {
      case 'string': {
        return StringField.create(input)
      }
      case 'number': {
        return NumberField.create(input)
      }
      case 'date': {
        return DateField.create(input)
      }
      case 'date-range': {
        return DateRangeField.create(input)
      }
      case 'select': {
        return SelectField.create(input)
      }
      case 'bool': {
        return BoolField.create(input)
      }

      default:
        throw new Error('invalid field type')
    }
  }

  static unsafeCreate(input: ICreateFieldSchema): Field {
    switch (input.type) {
      case 'string': {
        return StringField.unsafeCreate(input)
      }
      case 'number': {
        return NumberField.unsafeCreate(input)
      }
      case 'date': {
        return DateField.unsafeCreate(input)
      }
      case 'date-range': {
        return DateRangeField.unsafeCreate(input)
      }
      case 'select': {
        return SelectField.unsafeCreate(input)
      }
      case 'bool': {
        return BoolField.unsafeCreate(input)
      }

      default:
        throw new Error('invalid field type')
    }
  }
}
