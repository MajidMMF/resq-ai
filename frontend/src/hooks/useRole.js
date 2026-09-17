import useAuth from "./useAuth";

export const useRole = () => {
  const { roles, primaryRole, isAdmin, isAmbulance, isHospital, isUser, hasRole } =
    useAuth();

  return {
    roles,
    primaryRole,
    isAdmin,
    isAmbulance,
    isHospital,
    isUser,
    hasRole,
  };
};

export default useRole;

