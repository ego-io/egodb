import { ValueObject } from "@undb/domain"
import { widgetId, type IWidgetDTO, type IWidgetType } from "@undb/table"
import { z } from "@undb/zod"
import { match } from "ts-pattern"
import type { IAddDashboardWidgetDTO } from "../dto/add-dashboard-widget.dto"
import { WithDashboardLayout } from "../specifications"

export const dashboardLayoutSchema = z.object({
  x: z.number().nonnegative(),
  y: z.number().nonnegative(),
  w: z.number().nonnegative(),
  h: z.number().nonnegative(),
  min: z
    .object({
      w: z.number().nonnegative(),
      h: z.number().nonnegative(),
    })
    .optional(),
  max: z
    .object({
      w: z.number().nonnegative(),
      h: z.number().nonnegative(),
    })
    .optional(),
})

export type IDashboardLayout = z.infer<typeof dashboardLayoutSchema>

export const dashboardLayoutsSchema = z.record(widgetId, dashboardLayoutSchema).nullable()

export type IDashboardLayouts = z.infer<typeof dashboardLayoutsSchema>

export class DashboardLayouts extends ValueObject<IDashboardLayouts> {
  constructor(layouts: IDashboardLayouts) {
    super(layouts ? layouts : { value: null })
  }

  static default(): IDashboardLayout {
    return this.defaultLayout("aggregate")
  }

  static defaultLayout(type: IWidgetType): IDashboardLayout {
    return match(type)
      .with("aggregate", () => ({
        x: 0,
        y: 0,
        w: 6,
        h: 2,
        min: {
          w: 4,
          h: 2,
        },
      }))
      .with("chart", () => ({
        x: 0,
        y: 0,
        w: 6,
        h: 4,
        min: {
          w: 4,
          h: 2,
        },
      }))
      .with("table", () => ({
        x: 0,
        y: 0,
        w: 6,
        h: 4,
        min: {
          w: 4,
          h: 2,
        },
      }))
      .exhaustive()
  }

  getLayout(widget: IWidgetDTO): IDashboardLayout {
    const layout = this.value?.[widget.id]
    if (layout) {
      return layout
    }

    return DashboardLayouts.defaultLayout(widget.item.type)
  }

  addLayout(widget: IWidgetDTO, layout: IDashboardLayout): IDashboardLayouts {
    return {
      ...this.value,
      [widget.id]: layout,
    }
  }

  $addWidget(dto: IAddDashboardWidgetDTO): WithDashboardLayout {
    const layout = this.addLayout(dto.widget.widget, dto.layout)
    return new WithDashboardLayout(layout)
  }

  toJSON(): IDashboardLayouts {
    return this.value
  }
}
