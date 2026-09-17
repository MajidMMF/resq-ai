import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useGetMeQuery } from "../../features/auth/authApi";
import { setUser, selectUser, selectIsAuthenticated } from "../../features/auth/authSlice";
import ResQLogo from "../shared/ResQLogo";

export const AuthGuard = ({ children }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectUser);

  // Hydrate session on app refresh
  const { data, isLoading, isError } = useGetMeQuery(undefined, {
    skip: isAuthenticated && !!currentUser,
  });

  useEffect(() => {
    if (data?.data) {
      dispatch(setUser(data.data));
    }
  }, [data, dispatch]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-dark-950 text-white">
        <ResQLogo className="w-16 h-16 animate-pulse" pulse />
        <p className="text-xs font-mono uppercase tracking-widest text-dark-400 mt-4">
          Verifying Session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated && !data?.data) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default AuthGuard;
