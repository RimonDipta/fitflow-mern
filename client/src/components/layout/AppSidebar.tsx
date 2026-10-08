import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  CreditCard,
  Dumbbell,
  Home,
  Package,
  Settings,
  Users,
  UserRoundCog,
} from "lucide-react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../../features/auth/context/AuthContext";
import type { UserRole } from "../../features/auth/types/auth.types";

interface NavigationItem {
  label: string;
  path: string;
  icon: typeof Home;
  roles: UserRole[];
}

const allRoles: UserRole[] = [
  "SUPER_ADMIN",
  "GYM_ADMIN",
  "TRAINER",
  "STAFF",
  "MEMBER",
];

const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: Home,
    roles: allRoles,
  },
  {
    label: "Members",
    path: "/members",
    icon: Users,
    roles: ["SUPER_ADMIN", "GYM_ADMIN", "STAFF"],
  },
  {
    label: "Membership Plans",
    path: "/membership-plans",
    icon: CreditCard,
    roles: ["SUPER_ADMIN", "GYM_ADMIN", "STAFF"],
  },
  {
    label: "Trainers",
    path: "/trainers",
    icon: UserRoundCog,
    roles: ["SUPER_ADMIN", "GYM_ADMIN", "STAFF"],
  },
  {
    label: "Attendance",
    path: "/attendance",
    icon: ClipboardList,
    roles: ["SUPER_ADMIN", "GYM_ADMIN", "TRAINER", "STAFF", "MEMBER"],
  },
  {
    label: "Workouts",
    path: "/workouts",
    icon: Dumbbell,
    roles: ["SUPER_ADMIN", "GYM_ADMIN", "TRAINER", "MEMBER"],
  },
  {
    label: "Classes",
    path: "/classes",
    icon: CalendarDays,
    roles: ["SUPER_ADMIN", "GYM_ADMIN", "TRAINER", "STAFF", "MEMBER"],
  },
  {
    label: "Payments",
    path: "/payments",
    icon: CreditCard,
    roles: ["SUPER_ADMIN", "GYM_ADMIN", "STAFF", "MEMBER"],
  },
  {
    label: "Equipment",
    path: "/equipment",
    icon: Package,
    roles: ["SUPER_ADMIN", "GYM_ADMIN", "STAFF"],
  },
  {
    label: "Reports",
    path: "/reports",
    icon: BarChart3,
    roles: ["SUPER_ADMIN", "GYM_ADMIN"],
  },
  {
    label: "Settings",
    path: "/settings",
    icon: Settings,
    roles: ["SUPER_ADMIN", "GYM_ADMIN"],
  },
];

const AppSidebar = () => {
  const { user } = useAuth();

  const visibleItems = navigationItems.filter(
    (item) => user?.role && item.roles.includes(user.role),
  );

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">F</div>

        <div>
          <strong>FitFlow</strong>
          <span>Gym Management</span>
        </div>
      </div>

      <nav className="sidebar-navigation">
        <span className="sidebar-section-label">Workspace</span>

        {visibleItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
              }
            >
              <Icon size={18} strokeWidth={1.8} />

              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <span>FitFlow</span>
        <span>v1.0</span>
      </div>
    </aside>
  );
};

export default AppSidebar;
