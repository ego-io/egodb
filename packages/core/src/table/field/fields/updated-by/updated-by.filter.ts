import { z } from 'zod'
import { userIdSchema } from '../../../../user/value-objects/user-id.vo.js'
import { baseFilter } from '../../../filter/filter.base.js'
import { $eq, $in, $is_empty, $is_not_empty, $neq, $nin } from '../../../filter/operators.js'

export const updatedByFilterOperators = z.union([$eq, $neq, $in, $nin, $is_empty, $is_not_empty])
export type IUpdatedByFilterOperator = z.infer<typeof updatedByFilterOperators>

export const updatedByFilterValue = userIdSchema
export const updatedByFilter = z
  .object({
    type: z.literal('updated-by'),
    operator: updatedByFilterOperators,
    value: updatedByFilterValue,
  })
  .merge(baseFilter)

export type IUpdatedByFilter = z.infer<typeof updatedByFilter>
