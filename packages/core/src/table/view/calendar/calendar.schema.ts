import { z } from 'zod'
import { isDateField } from '../../field/date-field.type.js'
import { isDateRangeField } from '../../field/date-range-field.type.js'
import { fieldIdSchema } from '../../field/value-objects/field-id.schema.js'

export const calendarSchema = z.object({
  fieldId: fieldIdSchema.optional(),
})

export const calendarField = z.union([isDateField, isDateRangeField])

export type ICalendarField = z.infer<typeof calendarField>

export type ICalendarSchema = z.infer<typeof calendarSchema>
