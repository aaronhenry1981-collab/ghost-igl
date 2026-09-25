// Route modules registered on top of the core customer routes in app.mjs.
// Each module: ({ ctx, requireUser, requireAdmin }) => { routes, homeHook?, decisionHook?, decisionPrecheck? }
import { adminRoutes } from './admin.mjs'
import { messageRoutes } from './messages.mjs'
import { outreachRoutes } from './outreach.mjs'

export const routeModules = [adminRoutes, messageRoutes, outreachRoutes]
