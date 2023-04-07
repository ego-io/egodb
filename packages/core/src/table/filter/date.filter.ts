import { z } from 'zod'
import { baseFilter } from './filter.base.js'
import { dateFilterOperators } from './operators.js'

export const dateFilterValue = z.string().datetime().nullable()
export const dateFilter = z
  .object({
    type: z.literal('date'),
    operator: dateFilterOperators,
    value: dateFilterValue,
  })
  .merge(baseFilter)
export type IDateFilter = z.infer<typeof dateFilter>
