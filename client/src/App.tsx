import { Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "./components/layout/AppLayout";
import { ProtectedRoute } from "./features/auth/components/ProtectedRoute";

import DashboardPage from "./features/dashboard/pages/DashboardPage";
import LoginPage from "./features/auth/pages/LoginPage";
import RegisterPage from "./features/auth/pages/RegisterPage";

import MembersPage from "./features/members/pages/MembersPage";
import MemberProfilePage from "./features/members/pages/MemberProfilePage";

import TrainersPage from "./features/trainers/pages/TrainersPage";
import AttendancePage from "./features/attendance/pages/AttendancePage";
import WorkoutsPage from "./features/workouts/pages/WorkoutsPage";
import ClassesPage from "./features/classes/pages/ClassesPage";
import PaymentsPage from "./features/payments/pages/PaymentsPage";
import EquipmentPage from "./features/equipment/pages/EquipmentPage";
import ReportsPage from "./features/reports/pages/ReportsPage";
import SettingsPage from "./features/settings/pages/SettingsPage";

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />

          <Route path="/members" element={<MembersPage />} />

          <Route path="/members/:memberId" element={<MemberProfilePage />} />

          <Route path="/trainers" element={<TrainersPage />} />

          <Route path="/attendance" element={<AttendancePage />} />

          <Route path="/workouts" element={<WorkoutsPage />} />

          <Route path="/classes" element={<ClassesPage />} />

          <Route path="/payments" element={<PaymentsPage />} />

          <Route path="/equipment" element={<EquipmentPage />} />

          <Route path="/reports" element={<ReportsPage />} />

          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
