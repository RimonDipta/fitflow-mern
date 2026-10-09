import { useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Ban,
  CalendarDays,
  Clock,
  CreditCard,
  Users,
} from "lucide-react";

import { useAuth } from "../../auth/context/AuthContext";
import { getCurrentGym } from "../../gym/api/gym.api";
import type { Gym } from "../../gym/api/gym.api";

import { getDashboardStats, type DashboardStats } from "../api/dashboard.api";

interface StatCard {
  label: string;
  value: number;
  description: string;
  icon: typeof Users;
}

const DashboardPage = () => {
  const { user } = useAuth();

  const [gym, setGym] = useState<Gym | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const [isLoadingGym, setIsLoadingGym] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const [gymError, setGymError] = useState("");
  const [statsError, setStatsError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadGym = async (): Promise<void> => {
      try {
        const currentGym = await getCurrentGym();

        if (isMounted) {
          setGym(currentGym);
        }
      } catch (error) {
        if (isMounted) {
          setGymError(
            error instanceof Error
              ? error.message
              : "Unable to load gym information",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingGym(false);
        }
      }
    };

    const loadStats = async (): Promise<void> => {
      try {
        const dashboardStats = await getDashboardStats();

        if (isMounted) {
          setStats(dashboardStats);
        }
      } catch (error) {
        if (isMounted) {
          setStatsError(
            error instanceof Error
              ? error.message
              : "Unable to load dashboard statistics",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingStats(false);
        }
      }
    };

    void loadGym();
    void loadStats();

    return () => {
      isMounted = false;
    };
  }, []);

  const statCards: StatCard[] = stats
    ? [
        {
          label: "Total Members",
          value: stats.totalMembers,
          description: "All registered gym members",
          icon: Users,
        },
        {
          label: "Active Memberships",
          value: stats.activeMemberships,
          description: "Currently active memberships",
          icon: Activity,
        },
        {
          label: "Expiring in 7 Days",
          value: stats.expiringWithin7Days,
          description: "Active memberships nearing expiry",
          icon: Clock,
        },
        {
          label: "Expired Memberships",
          value: stats.expiredMemberships,
          description: "Memberships marked as expired",
          icon: CalendarDays,
        },
        {
          label: "Cancelled Memberships",
          value: stats.cancelledMemberships,
          description: "Memberships marked as cancelled",
          icon: Ban,
        },
        {
          label: "Pending Payments",
          value: stats.pendingPayments,
          description: `${stats.partialPayments} partially paid membership(s)`,
          icon: CreditCard,
        },
      ]
    : [];

  return (
    <div className="dashboard-workspace">
      <section className="dashboard-intro">
        <div>
          <span className="dashboard-eyebrow">OVERVIEW</span>

          <h1>Good morning, {user?.name?.split(" ")[0] ?? "there"}.</h1>

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

      {statsError && (
        <div className="auth-error" role="alert">
          {statsError}
        </div>
      )}

      <section className="dashboard-stats" aria-label="Gym statistics">
        {isLoadingStats &&
          Array.from({ length: 6 }, (_, index) => (
            <article className="stat-card" key={index}>
              <div className="stat-card-top">
                <span>Loading statistic</span>
              </div>

              <strong>—</strong>

              <span className="stat-card-meta">Loading dashboard data...</span>
            </article>
          ))}

        {!isLoadingStats &&
          !statsError &&
          statCards.map((card) => {
            const Icon = card.icon;

            return (
              <article className="stat-card" key={card.label}>
                <div className="stat-card-top">
                  <span>{card.label}</span>

                  <div className="stat-icon">
                    <Icon size={18} strokeWidth={1.8} />
                  </div>
                </div>

                <strong>{card.value.toLocaleString()}</strong>

                <span className="stat-card-meta">{card.description}</span>
              </article>
            );
          })}
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
