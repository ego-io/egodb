import { Query, type QueryProps } from "@undb/domain"
import { aggregateResult, fieldId, getAggregatesDTO, type IViewAggregate } from "@undb/table"
import { z } from "@undb/zod"

export const getAggregatesQuery = getAggregatesDTO

export type IGetAggregatesQuery = z.infer<typeof getAggregatesQuery>

export const getAggregatesOutput = z.record(fieldId, aggregateResult)

export type IGetAggregatesOutput = z.infer<typeof getAggregatesOutput>

export class GetAggregatesQuery extends Query implements IGetAggregatesQuery {
  public readonly tableId: string
  public readonly viewId?: string
  public readonly aggregate?: IViewAggregate

  constructor(props: QueryProps<IGetAggregatesQuery>) {
    super()
    this.tableId = props.tableId
    this.viewId = props.viewId
    this.aggregate = props.aggregate
  }
}
