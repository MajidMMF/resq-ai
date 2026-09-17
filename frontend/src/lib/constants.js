/**
 * Role-based redirect path helper
 * Priority: ADMIN > AMBULANCE_DRIVER > HOSPITAL_STAFF > USER
 */
export function getRedirectPath(roles = []) {
  const normRoles = Array.isArray(roles) ? roles : [roles];
  if (normRoles.includes("ADMIN")) return "/admin";
  if (normRoles.includes("AMBULANCE_DRIVER")) return "/ambulance";
  if (normRoles.includes("HOSPITAL_STAFF")) return "/hospital";
  return "/dashboard";
}

export const USER_ROLES = {
  USER: "USER",
  AMBULANCE_DRIVER: "AMBULANCE_DRIVER",
  HOSPITAL_STAFF: "HOSPITAL_STAFF",
  ADMIN: "ADMIN",
};

