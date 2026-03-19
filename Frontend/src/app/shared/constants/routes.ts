export const ROUTE_PATHS = {
  LOGIN: 'login',
  REGISTER: 'register',
  INFO: 'info'
} as const;

export const ROUTES = {
  LOGIN: `/${ROUTE_PATHS.LOGIN}`,
  REGISTER: `/${ROUTE_PATHS.REGISTER}`,
  INFO: `/${ROUTE_PATHS.INFO}`
} as const;

