// Route modules registered on top of the core customer routes in app.mjs.
// Each module: ({ ctx, requireUser, requireAdmin }) => { routes, homeHook?, decisionHook? }
import { adminRoutes } from './admin.mjs'

export const routeModules = [adminRoutes]
