import { None, Option, Some } from "@undb/domain"
import { z } from "@undb/zod"
import type { IDuplicateViewDTO } from "../../../../dto"
import { WithNewView, WithView } from "../../../../specifications/table-view.specification"
import { ViewIdVo } from "../view-id.vo"
import { AbstractView, baseViewDTO, createBaseViewDTO, updateBaseViewDTO } from "./abstract-view.vo"

export const GRID_TYPE = "grid" as const

export const gridOption = z.object({
  widths: z.record(z.number().positive()),
})

export type IGridOption = z.infer<typeof gridOption>

export const createGridViewDTO = createBaseViewDTO.extend({
  type: z.literal(GRID_TYPE),
  grid: gridOption.optional(),
})

export type ICreateGridViewDTO = z.infer<typeof createGridViewDTO>

export const gridViewDTO = baseViewDTO.extend({
  type: z.literal(GRID_TYPE),
  grid: gridOption.optional(),
})

export type IGridViewDTO = z.infer<typeof gridViewDTO>

export const updateGridViewDTO = updateBaseViewDTO.merge(
  z.object({
    type: z.literal(GRID_TYPE),
    grid: gridOption.optional(),
  }),
)

export type IUpdateGridViewDTO = z.infer<typeof updateGridViewDTO>

export class GridView extends AbstractView {
  grid: Option<IGridOption> = None
  constructor(dto: IGridViewDTO) {
    super(dto)
    this.grid = Option(dto.grid)
  }

  static create(dto: ICreateGridViewDTO) {
    return new GridView({ ...dto, id: ViewIdVo.fromStringOrCreate(dto.id).value })
  }

  override type = GRID_TYPE

  override $update(input: IUpdateGridViewDTO): Option<WithView> {
    const json = this.toJSON()
    const view = new GridView({
      ...json,
      name: input.name,
      id: this.id.value,
      type: GRID_TYPE,
      grid: input.grid ?? this.grid.into(undefined),
    })

    return Some(new WithView(this, view))
  }

  override $duplicate(dto: IDuplicateViewDTO): Option<WithNewView> {
    const json = this.toJSON()

    return Some(
      new WithNewView(
        new GridView({
          ...json,
          name: dto.name,
          isDefault: false,
          id: ViewIdVo.create().value,
          type: GRID_TYPE,
          grid: this.grid.into(undefined),
        }),
      ),
    )
  }
}
