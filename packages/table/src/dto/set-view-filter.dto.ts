import { z } from "zod"
import { filterGroup, viewId } from "../modules"
import { tableId } from "../table-id.vo"

export const setViewColorDTO = z.object({
  tableId: tableId,
  viewId: viewId.optional(),
  color: filterGroup,
})

export type ISetViewColorDTO = z.infer<typeof setViewColorDTO>
