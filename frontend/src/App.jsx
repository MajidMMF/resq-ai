import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Guards
import AuthGuard from "./components/guards/AuthGuard";
import RoleGuard from "./components/guards/RoleGuard";

// Public Pages
import PublicLayout from "./components/layout/PublicLayout";
import Landing from "./pages/public/Landing";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import Verify2FA from "./pages/public/Verify2FA";

// User Panel (Phase 3)
import UserLayout from "./components/layout/UserLayout";
import Dashboard from "./pages/user/Dashboard";
import ReportWizard from "./pages/user/ReportWizard";
import Emergency from "./pages/user/Emergency";
import History from "./pages/user/History";
import Notifications from "./pages/user/Notifications";
import Profile from "./pages/user/Profile";

// Ambulance Driver Panel (Phase 7)
import AmbulanceLayout from "./components/layout/AmbulanceLayout";
import AmbulanceDashboard from "./pages/ambulance/AmbulanceDashboard";
import ActiveRun from "./pages/ambulance/ActiveRun";
import AmbulanceHistory from "./pages/ambulance/AmbulanceHistory";
import AmbulanceProfile from "./pages/ambulance/AmbulanceProfile";

// Hospital ER & Trauma Panel (Phase 8)
import HospitalLayout from "./components/layout/HospitalLayout";
import HospitalDashboard from "./pages/hospital/HospitalDashboard";
import BedCapacity from "./pages/hospital/BedCapacity";
import PatientHistory from "./pages/hospital/PatientHistory";
import HospitalSettings from "./pages/hospital/HospitalSettings";

// Operations Admin Command Center (Phase 10)
import AdminLayout from "./components/layout/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageAmbulances from "./pages/admin/ManageAmbulances";
import ManageHospitals from "./pages/admin/ManageHospitals";
import ManageIncidents from "./pages/admin/ManageIncidents";
import SystemAnalytics from "./pages/admin/SystemAnalytics";

export const App = () => {
  return (
    <Routes>
      {/* 1. Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-2fa" element={<Verify2FA />} />
      </Route>

      {/* 2. USER Panel Protected Routes */}
      <Route
        element={
          <AuthGuard>
            <RoleGuard allow={["USER", "AMBULANCE_DRIVER", "HOSPITAL_STAFF", "ADMIN"]}>
              <UserLayout />
            </RoleGuard>
          </AuthGuard>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/report" element={<ReportWizard />} />
        <Route path="/emergency/:incidentId" element={<Emergency />} />
        <Route path="/history" element={<History />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* 3. AMBULANCE Role Routes (Phase 7) */}
      <Route
        element={
          <AuthGuard>
            <RoleGuard allow={["AMBULANCE_DRIVER", "ADMIN"]}>
              <AmbulanceLayout />
            </RoleGuard>
          </AuthGuard>
        }
      >
        <Route path="/ambulance" element={<AmbulanceDashboard />} />
        <Route path="/ambulance/run/:id" element={<ActiveRun />} />
        <Route path="/ambulance/history" element={<AmbulanceHistory />} />
        <Route path="/ambulance/profile" element={<AmbulanceProfile />} />
      </Route>

      {/* 4. HOSPITAL Role Routes (Phase 8) */}
      <Route
        element={
          <AuthGuard>
            <RoleGuard allow={["HOSPITAL_STAFF", "ADMIN"]}>
              <HospitalLayout />
            </RoleGuard>
          </AuthGuard>
        }
      >
        <Route path="/hospital" element={<HospitalDashboard />} />
        <Route path="/hospital/capacity" element={<BedCapacity />} />
        <Route path="/hospital/history" element={<PatientHistory />} />
        <Route path="/hospital/settings" element={<HospitalSettings />} />
      </Route>

      {/* 5. ADMIN Operations Command Center (Phase 10) */}
      <Route
        element={
          <AuthGuard>
            <RoleGuard allow={["ADMIN"]}>
              <AdminLayout />
            </RoleGuard>
          </AuthGuard>
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/ambulances" element={<ManageAmbulances />} />
        <Route path="/admin/hospitals" element={<ManageHospitals />} />
        <Route path="/admin/incidents" element={<ManageIncidents />} />
        <Route path="/admin/analytics" element={<SystemAnalytics />} />
      </Route>

      {/* 6. Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
