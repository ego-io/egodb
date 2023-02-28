import { ValueObject } from '@egodb/domain'

export class DateFormat extends ValueObject<string> {
  static fromString(format: string) {
    return new this({ value: format })
  }
}
