import type { ISpecVisitor } from "@undb/domain"
import type { TableBaseIdSpecification } from "./table-base-id.specification"
import type {
  TableFormsSpecification,
  WithFormIdSpecification,
  WithFormSpecification,
  WithNewFormSpecification,
} from "./table-forms.specification"
import type { TableIdSpecification, TableIdsSpecification } from "./table-id.specification"
import type { TableNameSpecification, TableUniqueNameSpecification } from "./table-name.specification"
import type { WithTableRLS } from "./table-rls.specification"
import type {
  TableSchemaSpecification,
  WithDuplicatedFieldSpecification,
  WithForeignRollupFieldSpec,
  WithNewFieldSpecification,
  WithoutFieldSpecification,
  WithTableForeignTablesSpec,
  WithUpdatedFieldSpecification,
} from "./table-schema.specification"
import type {
  WithNewView,
  WithoutView,
  WithView,
  WithViewAggregate,
  WithViewColor,
  WithViewFields,
  WithViewFilter,
  WithViewIdSpecification,
  WithViewOption,
  WithViewSort,
} from "./table-view.specification"
import type { TableViewsSpecification } from "./table-views.specification"

export interface ITableSpecVisitor extends ISpecVisitor {
  withId(id: TableIdSpecification): void
  withBaseId(id: TableBaseIdSpecification): void
  idsIn(ids: TableIdsSpecification): void
  withName(name: TableNameSpecification): void
  withSchema(schema: TableSchemaSpecification): void
  withNewField(schema: WithNewFieldSpecification): void
  withDuplicateField(schema: WithDuplicatedFieldSpecification): void
  withoutField(schema: WithoutFieldSpecification): void
  withUpdatedField(spec: WithUpdatedFieldSpecification): void
  withTableRLS(rls: WithTableRLS): void
  withViews(views: TableViewsSpecification): void
  withView(views: WithView): void
  withNewView(views: WithNewView): void
  withoutView(view: WithoutView): void
  withViewId(spec: WithViewIdSpecification): void
  withViewFilter(viewFilter: WithViewFilter): void
  withViewOption(viewOption: WithViewOption): void
  withViewColor(viewColor: WithViewColor): void
  withViewSort(viewSort: WithViewSort): void
  withViewAggregate(viewColor: WithViewAggregate): void
  withViewFields(fields: WithViewFields): void
  withForms(views: TableFormsSpecification): void
  withFormId(spec: WithFormIdSpecification): void
  withNewForm(views: WithNewFormSpecification): void
  withForm(views: WithFormSpecification): void
  withForeignRollupField(spec: WithForeignRollupFieldSpec): void
  withTableForeignTables(spec: WithTableForeignTablesSpec): void
  withTableUnqueName(spec: TableUniqueNameSpecification): void
}