import { type ISpecification } from '@egodb/domain'
import { type Table } from '../table'
import type { WithTableId } from './table-id.specifaction'
import type { WithName } from './table-name.specification'

export interface ITableSpecVisitor {
  idEqual(s: WithTableId): void
  nameEqual(s: WithName): void
}

export type ITableSpec = ISpecification<Table, ITableSpecVisitor>
