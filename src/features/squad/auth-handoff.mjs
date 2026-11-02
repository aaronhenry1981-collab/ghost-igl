export function isSquadStandalonePath(value) {
  return typeof value === 'string' && value.length <= 1024 && !/[\\\u0000-\u001f]/.test(value) && /^\/squad-preview\/(?:index\.html)?(?:\?[^#]*)?(?:#.*)?$/.test(value)
}
