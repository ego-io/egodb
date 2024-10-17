import { Option, Some, ValueObject } from "@undb/domain"
import { TableDo, tableId, widgetDTO, WidgetVO, type IWidgetDTO } from "@undb/table"
import * as z from "@undb/zod"
import type { IUpdateDashboardWidgetDTO } from "../dto/update-dashboard-widget.dto"
import { WithDashboardWidgets, type DashboardComositeSpecification } from "../specifications"

export const dashboardWidgetSchema = z.object({
  table: z.object({
    id: tableId.optional(),
  }),
  widget: widgetDTO,
})

export type IDashboardWidget = z.infer<typeof dashboardWidgetSchema>

export class DashboardWidget extends ValueObject<IDashboardWidget> {
  static default(tableId: string | undefined, name = "Count") {
    return new DashboardWidget({
      table: {
        id: tableId,
      },
      widget: WidgetVO.default(name).toJSON(),
    })
  }

  /**
   * Creates a DashboardWidget instance
   * @param table Table object
   * @param dto Dashboard widget data transfer object
   * @returns DashboardWidget instance
   *
   * Note: For aggregate type widgets, if the field parameter is a field name
   * instead of an ID, this method converts it to the corresponding field ID.
   * This ensures internal consistency while allowing users to use more
   * user-friendly field names when creating widgets.
   */
  static from(table: TableDo, widget: IWidgetDTO): DashboardWidget {
    if (widget.item.type === "aggregate") {
      if (widget.item.aggregate.type === "count") {
        return new DashboardWidget({
          table: {
            id: table.id.value,
          },
          widget,
        })
      } else {
        const fieldIdOrName = widget.item.aggregate.config.field
        if (!fieldIdOrName) {
          return new DashboardWidget({
            table: {
              id: table.id.value,
            },
            widget,
          })
        }
        const fieldId = table.schema.getFieldByIdOrName(fieldIdOrName).unwrap().id.value
        return new DashboardWidget({
          table: {
            id: table.id.value,
          },
          widget: {
            ...widget,
            item: {
              ...widget.item,
              aggregate: {
                ...widget.item.aggregate,
                config: {
                  ...widget.item.aggregate.config,
                  field: fieldId,
                },
              },
            },
          },
        })
      }
    }
    return new DashboardWidget({
      table: {
        id: table.id.value,
      },
      widget,
    })
  }

  toJSON(): IDashboardWidget {
    return {
      widget: this.props.widget,
      table: {
        id: this.props.table.id,
      },
    }
  }
}

export const dashboardWidgetsSchema = z.array(dashboardWidgetSchema)

export type IDashboardWidgets = z.infer<typeof dashboardWidgetsSchema>

export class DashboardWidgets extends ValueObject<IDashboardWidgets> {
  static from(dtos: { table: TableDo; widget: IWidgetDTO }[]): DashboardWidgets {
    const widgets = dtos.map((dto) => DashboardWidget.from(dto.table, dto.widget))
    return new DashboardWidgets(widgets.map((w) => w.toJSON()))
  }

  addWidget(table: TableDo, dto: IDashboardWidget): DashboardWidgets {
    const widget = DashboardWidget.from(table, dto.widget)
    return new DashboardWidgets([...this.value, widget.toJSON()])
  }

  $addWidget(table: TableDo, dto: IDashboardWidget): DashboardComositeSpecification {
    const widgets = this.addWidget(table, dto)
    return new WithDashboardWidgets(widgets)
  }

  updateWidget(widget: IDashboardWidget): DashboardWidgets {
    const newWidget = new DashboardWidget({
      table: widget.table,
      widget: widget.widget,
    })
    return new DashboardWidgets(
      this.value.map((w) => (w.widget.id === newWidget.props.widget.id ? newWidget.toJSON() : w)),
    )
  }

  $updateWidget({ widget }: IUpdateDashboardWidgetDTO): Option<DashboardComositeSpecification> {
    const widgets = this.updateWidget(widget)
    const spec = new WithDashboardWidgets(widgets)

    return Some(spec)
  }

  deleteWidget(widgetId: string): DashboardWidgets {
    return new DashboardWidgets(this.value.filter((w) => w.widget.id !== widgetId))
  }

  $deleteWidget(widgetId: string): Option<DashboardComositeSpecification> {
    const widgets = this.deleteWidget(widgetId)
    const spec = new WithDashboardWidgets(widgets)
    return Some(spec)
  }
}
