/**
 * ASTRA - Centralized Page Permission Mapping
 *
 * Permission strings here are the EXACT identifiers used by the backend RBAC:
 *   - backend/routes/audit.js       -> authorize('view_audit_logs')
 *   - backend/routes/users.js       -> authorize('manage_users')
 *   - backend/routes/datasets.js    -> authorize('upload_datasets'), authorize('manage_datasets')
 *   - backend/routes/forecasts.js   -> authorize('generate_forecasts')
 *   - backend/routes/analytics.js   -> protect only (no authorize) - all authenticated roles
 *
 * Role strings match backend/models/Role.js enum exactly:
 *   'Administrator', 'Data Analyst', 'Resource Planning Officer', 'Department Officer'
 */
export const PAGE_PERMISSIONS = {
  dashboard:   [],                                         // All authenticated users
  datasets:    ['upload_datasets', 'manage_datasets'],     // Admin + Data Analyst
  analytics:   ['upload_datasets', 'manage_datasets'],     // Admin + Data Analyst
  forecasting: ['generate_forecasts'],                     // Admin + Resource Planning Officer
  users:       ['manage_users'],                           // Admin only
  audit:       ['view_audit_logs'],                        // Admin only
};

export const PAGE_ROLES_MAP = {
  dashboard:   ['Administrator', 'Data Analyst', 'Resource Planning Officer', 'Department Officer'],
  datasets:    ['Administrator', 'Data Analyst'],
  analytics:   ['Administrator', 'Data Analyst'],
  forecasting: ['Administrator', 'Resource Planning Officer'],
  users:       ['Administrator'],
  audit:       ['Administrator'],
};

/**
 * Returns true if the user may access the given page tab.
 * @param {object|null} user - The user object from useAuth()
 * @param {string} page - Tab key: 'dashboard'|'datasets'|'analytics'|'forecasting'|'users'|'audit'
 * @returns {boolean}
 */
export const canAccessPage = (user, page) => {
  if (!user) return false;

  const required = PAGE_PERMISSIONS[page];
  if (required === undefined) return false;  // Unknown page - deny
  if (required.length === 0) return true;    // No restriction - allow all authenticated

  // Administrator bypasses all restrictions (mirrors hasPermission() in AuthContext)
  if (user.role === 'Administrator') return true;

  // User must hold at least one of the required permissions
  return required.some(p => Array.isArray(user.permissions) && user.permissions.includes(p));
};

/**
 * Returns the array of role names authorized to access a given page tab.
 * @param {string} page
 * @returns {string[]}
 */
export const getAuthorizedRolesForPage = (page) => {
  return PAGE_ROLES_MAP[page] || [];
};

/**
 * Returns the first tab the user is permitted to access.
 * Used to redirect when the current tab becomes unauthorized.
 * Dashboard is always accessible to authenticated users, so this always returns a valid tab.
 * @param {object|null} user
 * @returns {string}
 */
export const getDefaultTab = (user) => {
  const TAB_ORDER = ['dashboard', 'datasets', 'analytics', 'forecasting', 'users', 'audit'];
  return TAB_ORDER.find(tab => canAccessPage(user, tab)) ?? 'dashboard';
};
