export * from "./dashboard-id.specification.js"
export * from "./dashboard-name.specification.js"
export * from "./dashboard-q.specification.js"
export * from "./dashboard-space-id.specification.js"

import { CompositeSpecification, Err, Ok, Result } from "@undb/domain"
import type { Dashboard } from "../dashboard.do.js"
import type { IUniqueDashboardDTO } from "../dto/unique-dashboard.dto.js"
import type { IDashboardSpecVisitor } from "../interface.js"
import { DashboardId } from "../value-objects/dashboard-id.vo.js"
import { WithDashboardId } from "./dashboard-id.specification.js"
import { WithDashboardName } from "./dashboard-name.specification.js"

type DashboardComositeSpecification = CompositeSpecification<Dashboard, IDashboardSpecVisitor>

export const withUniqueDashboard = (dto: IUniqueDashboardDTO): Result<DashboardComositeSpecification, string> => {
  if (dto.dashboardId) {
    return Ok(new WithDashboardId(new DashboardId(dto.dashboardId)))
  }
  if (dto.dashboardName && dto.spaceId) {
    return Ok(WithDashboardName.fromString(dto.dashboardName))
  }
  return Err("Invalid dashboard specification")
}
