import { useEffect, useState } from "react";

import { getCurrentGym } from "../../gym/api/gym.api";
import { useAuth } from "../../auth/context/AuthContext";
import type { Gym } from "../../gym/api/gym.api";

const DashboardPage = () => {
  const { user, logout } = useAuth();

  const [gym, setGym] = useState<Gym | null>(null);

  const [isLoadingGym, setIsLoadingGym] = useState(true);

  const [gymError, setGymError] = useState("");

  useEffect(() => {
    const loadGym = async (): Promise<void> => {
      try {
        const currentGym = await getCurrentGym();

        setGym(currentGym);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to load gym";

        setGymError(message);
      } finally {
        setIsLoadingGym(false);
      }
    };

    void loadGym();
  }, []);

  const handleLogout = async (): Promise<void> => {
    await logout();
  };

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <span className="dashboard-eyebrow">FITFLOW</span>

          <h1>Dashboard</h1>
        </div>

        <div className="dashboard-user">
          <div>
            <strong>{user?.name}</strong>

            <span>{user?.role}</span>
          </div>

          <button
            type="button"
            onClick={() => {
              void handleLogout();
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <section className="dashboard-content">
        <div className="dashboard-card">
          <span className="card-label">Current gym</span>

          {isLoadingGym && <p>Loading gym...</p>}

          {!isLoadingGym && gymError && (
            <p className="auth-error">{gymError}</p>
          )}

          {!isLoadingGym && !gymError && gym && (
            <>
              <h2>{gym.name}</h2>

              <p>
                {gym.city}, {gym.country}
              </p>

              <span className="gym-slug">/{gym.slug}</span>
            </>
          )}
        </div>

        <div className="dashboard-card">
          <span className="card-label">Account</span>

          <h2>{user?.email}</h2>

          <p>Your authenticated FitFlow session is active.</p>
        </div>
      </section>
    </main>
  );
};

export default DashboardPage;
