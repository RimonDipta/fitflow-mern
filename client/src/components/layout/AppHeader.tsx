import { Bell, ChevronDown } from "lucide-react";

import { useAuth } from "../../features/auth/context/AuthContext";

const AppHeader = () => {
  const { user, logout } = useAuth();

  const handleLogout = async (): Promise<void> => {
    await logout();
  };

  return (
    <header className="app-header">
      <div className="header-title">
        <span>Workspace</span>
      </div>

      <div className="header-actions">
        <button
          type="button"
          className="header-icon-button"
          aria-label="Notifications"
        >
          <Bell size={19} strokeWidth={1.8} />
          <span className="notification-dot" />
        </button>

        <div className="header-divider" />

        <button
          type="button"
          className="header-profile"
          onClick={() => {
            void handleLogout();
          }}
          title="Sign out"
        >
          <div className="header-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>

          <div className="header-user-info">
            <strong>{user?.name}</strong>
            <span>{user?.role}</span>
          </div>

          <ChevronDown size={16} strokeWidth={1.8} />
        </button>
      </div>
    </header>
  );
};

export default AppHeader;
