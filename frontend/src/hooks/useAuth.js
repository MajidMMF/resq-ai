import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  selectUser,
  selectRoles,
  selectIsAuthenticated,
  selectAuthLoading,
  clearUser,
} from "../features/auth/authSlice";
import { useLogoutMutation } from "../features/auth/authApi";
import { toast } from "sonner";

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector(selectUser);
  const roles = useSelector(selectRoles);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const loading = useSelector(selectAuthLoading);

  const [logoutMutation] = useLogoutMutation();

  // Primary Role computation: ADMIN > AMBULANCE_DRIVER > HOSPITAL_STAFF > USER
  const primaryRole = (() => {
    if (roles.includes("ADMIN")) return "ADMIN";
    if (roles.includes("AMBULANCE_DRIVER")) return "AMBULANCE_DRIVER";
    if (roles.includes("HOSPITAL_STAFF")) return "HOSPITAL_STAFF";
    if (roles.includes("USER")) return "USER";
    return null;
  })();

  const isAdmin = roles.includes("ADMIN");
  const isAmbulance = roles.includes("AMBULANCE_DRIVER");
  const isHospital = roles.includes("HOSPITAL_STAFF");
  const isUser = roles.includes("USER");

  const hasRole = (role) => roles.includes(role);

  const logout = async () => {
    try {
      await logoutMutation().unwrap();
    } catch (err) {
      console.warn("Logout API warning:", err);
    } finally {
      dispatch(clearUser());
      toast.success("Logged out successfully");
      navigate("/login");
    }
  };

  return {
    user,
    roles,
    isAuthenticated,
    loading,
    primaryRole,
    isAdmin,
    isAmbulance,
    isHospital,
    isUser,
    hasRole,
    logout,
  };
};

export default useAuth;

