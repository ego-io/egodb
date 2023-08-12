import { z } from 'zod'
import { RBACHasNotPermission } from './rbac.errors.js'
import type { IRoles } from './role.vo.js'

export const tableActions = z.enum([
  'table:create',
  'table:update',
  'table:delete',
  'table:export',
  'table:create_field',
  'table:update_field',
  'table:duplicate_field',
  'table:delete_field',
  'table:create_view',
  'table:update_view_name',
  'table:move_view',
  'table:set_view_filter',
  'table:set_view_sort',
  'table:switch_view_display_type',
  'table:toggle_field_visibility',
  'table:move_field',
  'table:set_row_height',
  'table:set_width',
  'table:pin_field',
  'table:sort_field',
  'table:set_view_field',
  'table:delete_view',
  'table:duplicate_view',
  'table:create_form',
  'table:update_form',
])
export const recordActions = z.enum(['record:create', 'record:update', 'record:delete', 'record:list_trash'])
export const webhookActions = z.enum(['webhook:create', 'webhook:update', 'webhook:delete'])
export const shareActions = z.enum(['share:enable', 'share:disable'])
export const memberActions = z.enum(['member:update_role'])
export const rlsPermissionActions = z.enum(['rls:create', 'rls:update', 'rls:delete'])
export const widgetActions = z.enum(['widget:create', 'widget:relayout', 'widget:delete'])
export const visualizationActions = z.enum(['visualization:update'])

export type PermissionAction = z.infer<
  | typeof tableActions
  | typeof recordActions
  | typeof webhookActions
  | typeof rlsPermissionActions
  | typeof memberActions
  | typeof shareActions
  | typeof widgetActions
  | typeof visualizationActions
>

export const permissions: Record<IRoles, Record<PermissionAction, boolean>> = {
  owner: {
    'table:create': true,
    'table:update': true,
    'table:export': true,
    'table:delete': true,
    'table:create_field': true,
    'table:update_field': true,
    'table:duplicate_field': true,
    'table:delete_field': true,
    'table:create_form': true,
    'table:update_form': true,
    'table:create_view': true,
    'table:update_view_name': true,
    'table:move_view': true,
    'table:switch_view_display_type': true,
    'table:set_view_filter': true,
    'table:set_view_sort': true,
    'table:toggle_field_visibility': true,
    'table:set_row_height': true,
    'table:move_field': true,
    'table:set_width': true,
    'table:pin_field': true,
    'table:sort_field': true,
    'table:set_view_field': true,
    'table:delete_view': true,
    'table:duplicate_view': true,
    'record:create': true,
    'record:delete': true,
    'record:update': true,
    'record:list_trash': true,
    'webhook:create': true,
    'webhook:update': true,
    'webhook:delete': true,
    'member:update_role': true,
    'rls:create': true,
    'rls:update': true,
    'rls:delete': true,
    'share:enable': true,
    'share:disable': true,
    'widget:create': true,
    'widget:delete': true,
    'widget:relayout': true,
    'visualization:update': true,
  },
  admin: {
    'table:create': true,
    'table:export': true,
    'table:update': true,
    'table:delete': true,
    'table:create_field': true,
    'table:update_field': true,
    'table:duplicate_field': true,
    'table:delete_field': true,
    'table:create_view': true,
    'table:update_view_name': true,
    'table:move_view': true,
    'table:switch_view_display_type': true,
    'table:set_view_filter': true,
    'table:set_view_sort': true,
    'table:toggle_field_visibility': true,
    'table:set_row_height': true,
    'table:move_field': true,
    'table:set_width': true,
    'table:pin_field': true,
    'table:sort_field': true,
    'table:set_view_field': true,
    'table:delete_view': true,
    'table:duplicate_view': true,
    'table:create_form': true,
    'table:update_form': true,
    'record:create': true,
    'record:delete': true,
    'record:update': true,
    'record:list_trash': true,
    'webhook:create': true,
    'webhook:update': true,
    'webhook:delete': true,
    'member:update_role': true,
    'rls:create': true,
    'rls:update': true,
    'rls:delete': true,
    'share:enable': true,
    'share:disable': true,
    'widget:create': true,
    'widget:delete': true,
    'widget:relayout': true,
    'visualization:update': true,
  },
  editor: {
    'table:create': false,
    'table:export': true,
    'table:update': false,
    'table:delete': false,
    'table:create_field': false,
    'table:update_field': true,
    'table:duplicate_field': false,
    'table:delete_field': false,

    'table:create_view': true,
    'table:update_view_name': true,
    'table:move_view': true,
    'table:switch_view_display_type': true,
    'table:set_view_filter': true,
    'table:set_view_sort': true,
    'table:toggle_field_visibility': true,
    'table:set_row_height': true,
    'table:move_field': true,
    'table:set_width': true,
    'table:pin_field': true,
    'table:sort_field': true,
    'table:set_view_field': true,
    'table:delete_view': true,
    'table:duplicate_view': true,
    'table:create_form': true,
    'table:update_form': true,
    'record:create': true,
    'record:delete': true,
    'record:update': true,
    'record:list_trash': true,
    'webhook:create': true,
    'webhook:update': true,
    'webhook:delete': true,
    'member:update_role': false,
    'rls:create': false,
    'rls:update': false,
    'rls:delete': false,
    'share:enable': true,
    'share:disable': true,
    'widget:create': true,
    'widget:delete': true,
    'widget:relayout': true,
    'visualization:update': true,
  },
  viewer: {
    'table:create': false,
    'table:update': false,
    'table:export': true,
    'table:delete': false,
    'table:create_field': false,
    'table:update_field': true,
    'table:duplicate_field': false,
    'table:delete_field': false,

    'table:create_view': false,
    'table:update_view_name': false,
    'table:move_view': false,
    'table:switch_view_display_type': false,
    'table:set_view_filter': false,
    'table:set_view_sort': false,
    'table:toggle_field_visibility': false,
    'table:set_row_height': false,
    'table:move_field': false,
    'table:set_width': false,
    'table:pin_field': false,
    'table:sort_field': false,
    'table:set_view_field': false,
    'table:delete_view': false,
    'table:duplicate_view': false,
    'table:create_form': false,
    'table:update_form': false,
    'record:create': false,
    'record:delete': false,
    'record:update': false,
    'record:list_trash': false,
    'webhook:create': false,
    'webhook:update': false,
    'webhook:delete': false,
    'member:update_role': false,
    'rls:create': false,
    'rls:update': false,
    'rls:delete': false,
    'share:enable': true,
    'share:disable': true,
    'widget:create': false,
    'widget:delete': false,
    'widget:relayout': false,
    'visualization:update': false,
  },
}

export const getHasPermission = (role: IRoles, action: PermissionAction) => {
  if (!role) return false
  return !!permissions[role]?.[action]
}

export const checkPermission = (role: IRoles, action: PermissionAction) => {
  const has = getHasPermission(role, action)
  if (!has) throw new RBACHasNotPermission(role, action)
}

export const checkPermissions = (role: IRoles, actions: PermissionAction[]) => {
  for (const action of actions) {
    checkPermission(role, action)
  }
}
