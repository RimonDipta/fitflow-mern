import { useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  CreditCard,
  Users,
} from "lucide-react";

import { useAuth } from "../../auth/context/AuthContext";
import { getCurrentGym } from "../../gym/api/gym.api";
import type { Gym } from "../../gym/api/gym.api";

const DashboardPage = () => {
  const { user } = useAuth();

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

  return (
    <div className="dashboard-workspace">
      <section className="dashboard-intro">
        <div>
          <span className="dashboard-eyebrow">OVERVIEW</span>

          <h1>Good morning, {user?.name?.split(" ")[0]}.</h1>

          <p>Here is what's happening with your fitness business today.</p>
        </div>

        <div className="dashboard-date">
          <CalendarDays size={17} strokeWidth={1.8} />

          <span>
            {new Intl.DateTimeFormat("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            }).format(new Date())}
          </span>
        </div>
      </section>

      <section className="dashboard-stats">
        <article className="stat-card">
          <div className="stat-card-top">
            <span>Total Members</span>

            <div className="stat-icon">
              <Users size={18} strokeWidth={1.8} />
            </div>
          </div>

          <strong>—</strong>

          <span className="stat-card-meta">Member analytics coming soon</span>
        </article>

        <article className="stat-card">
          <div className="stat-card-top">
            <span>Attendance Today</span>

            <div className="stat-icon">
              <Activity size={18} strokeWidth={1.8} />
            </div>
          </div>

          <strong>—</strong>

          <span className="stat-card-meta">
            Attendance tracking coming soon
          </span>
        </article>

        <article className="stat-card">
          <div className="stat-card-top">
            <span>Monthly Revenue</span>

            <div className="stat-icon">
              <CreditCard size={18} strokeWidth={1.8} />
            </div>
          </div>

          <strong>—</strong>

          <span className="stat-card-meta">Payment analytics coming soon</span>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-panel dashboard-panel-large">
          <div className="dashboard-panel-header">
            <div>
              <span className="panel-label">GYM</span>

              <h2>Current gym</h2>
            </div>

            <ArrowUpRight size={19} strokeWidth={1.8} />
          </div>

          {isLoadingGym && (
            <div className="dashboard-loading">Loading gym information...</div>
          )}

          {!isLoadingGym && gymError && (
            <p className="auth-error">{gymError}</p>
          )}

          {!isLoadingGym && !gymError && gym && (
            <div className="gym-overview">
              <div className="gym-avatar">
                {gym.name.charAt(0).toUpperCase()}
              </div>

              <div>
                <h3>{gym.name}</h3>

                <p>
                  {gym.city && gym.country
                    ? `${gym.city}, ${gym.country}`
                    : "Location not configured"}
                </p>

                <span>/{gym.slug}</span>
              </div>
            </div>
          )}
        </article>

        <article className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <span className="panel-label">ACCOUNT</span>

              <h2>Your profile</h2>
            </div>
          </div>

          <div className="account-overview">
            <div className="account-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>{user?.name}</strong>

              <span>{user?.email}</span>

              <small>{user?.role}</small>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
};

export default DashboardPage;
