import { csRequest, currentIdToken, isCustomerSuccessConfigured } from '../../lib/customerSuccess'

// Player-side customer-success client. Always the signed-in player's own
// token: there is no parameter that could act on another player.
export function createLiveHomeApi() {
  if (!isCustomerSuccessConfigured()) return null
  return {
    preview: false,
    get: async (path) => csRequest(path, { token: await currentIdToken() }),
    post: async (path, body) => csRequest(path, { token: await currentIdToken(), method: 'POST', body }),
    put: async (path, body) => csRequest(path, { token: await currentIdToken(), method: 'PUT', body }),
  }
}
