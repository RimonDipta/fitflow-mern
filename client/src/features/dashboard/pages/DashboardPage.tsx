import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  Ban,
  CalendarDays,
  Clock,
  CreditCard,
  RefreshCw,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { useAuth } from "../../auth/context/AuthContext";
import { getCurrentGym } from "../../gym/api/gym.api";
import type { Gym } from "../../gym/api/gym.api";

import { getDashboardStats, type DashboardStats } from "../api/dashboard.api";

import "./DashboardPage.css";

interface StatCard {
  label: string;
  value: number;
  description: string;
  icon: LucideIcon;
  variant: "default" | "success" | "warning" | "danger" | "info";
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

const DashboardPage = () => {
  const { user, isLoading: isAuthLoading } = useAuth();

  const [gym, setGym] = useState<Gym | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const [isLoadingGym, setIsLoadingGym] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const [gymError, setGymError] = useState("");
  const [statsError, setStatsError] = useState("");

  const [retryKey, setRetryKey] = useState(0);

  const retryDashboard = useCallback(() => {
    setRetryKey((current) => current + 1);
  }, []);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!user) {
      setGym(null);
      setStats(null);
      setGymError("");
      setStatsError("");
      setIsLoadingGym(false);
      setIsLoadingStats(false);
      return;
    }

    let isMounted = true;

    setIsLoadingGym(true);
    setIsLoadingStats(true);
    setGymError("");
    setStatsError("");

    const loadGym = async (): Promise<void> => {
      try {
        const currentGym = await getCurrentGym();

        if (isMounted) {
          setGym(currentGym);
        }
      } catch (error) {
        if (isMounted) {
          setGymError(
            getErrorMessage(error, "Unable to load gym information."),
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
            getErrorMessage(error, "Unable to load dashboard statistics."),
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
  }, [isAuthLoading, user, retryKey]);

  const statCards: StatCard[] = stats
    ? [
        {
          label: "Total Members",
          value: stats.totalMembers,
          description: "All registered gym members",
          icon: Users,
          variant: "default",
        },
        {
          label: "Active Memberships",
          value: stats.activeMemberships,
          description: "Memberships currently active",
          icon: Activity,
          variant: "success",
        },
        {
          label: "Expiring in 7 Days",
          value: stats.expiringWithin7Days,
          description: "Active memberships nearing expiry",
          icon: Clock,
          variant: "warning",
        },
        {
          label: "Expired Memberships",
          value: stats.expiredMemberships,
          description: "Memberships marked as expired",
          icon: CalendarDays,
          variant: "danger",
        },
        {
          label: "Cancelled Memberships",
          value: stats.cancelledMemberships,
          description: "Memberships marked as cancelled",
          icon: Ban,
          variant: "default",
        },
        {
          label: "Pending Payments",
          value: stats.pendingPayments,
          description: "Memberships awaiting payment",
          icon: CreditCard,
          variant: "warning",
        },
        {
          label: "Partial Payments",
          value: stats.partialPayments,
          description: "Memberships with outstanding balances",
          icon: Wallet,
          variant: "info",
        },
      ]
    : [];

  if (isAuthLoading) {
    return (
      <div className="dashboard-workspace">
        <div className="dashboard-state" role="status">
          <RefreshCw className="dashboard-state-spinner" size={22} />
          <p>Restoring your session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-workspace">
      <section className="dashboard-intro">
        <div className="dashboard-intro-copy">
          <span className="dashboard-eyebrow">OVERVIEW</span>

          <h1>Good morning, {user?.name?.split(" ")[0] ?? "there"}.</h1>

          <p>Here is what is happening with your fitness business today.</p>
        </div>

        <div className="dashboard-date">
          <CalendarDays size={17} strokeWidth={1.8} />

          <span>
            {new Intl.DateTimeFormat("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
              year: "numeric",
            }).format(new Date())}
          </span>
        </div>
      </section>

      <section
        className="dashboard-section"
        aria-labelledby="dashboard-stats-heading"
      >
        <div className="dashboard-section-heading">
          <div>
            <span className="dashboard-section-eyebrow">AT A GLANCE</span>
            <h2 id="dashboard-stats-heading">Business overview</h2>
          </div>

          <button
            className="dashboard-refresh-button"
            type="button"
            onClick={retryDashboard}
            disabled={isLoadingGym || isLoadingStats}
            aria-label="Refresh dashboard data"
          >
            <RefreshCw
              size={15}
              className={
                isLoadingGym || isLoadingStats ? "dashboard-state-spinner" : ""
              }
            />
            Refresh
          </button>
        </div>

        {statsError && (
          <div className="dashboard-error" role="alert">
            <AlertCircle size={19} />

            <div className="dashboard-error-content">
              <strong>Statistics unavailable</strong>
              <p>{statsError}</p>

              <button
                className="dashboard-inline-retry"
                type="button"
                onClick={retryDashboard}
              >
                Try again
              </button>
            </div>
          </div>
        )}

        <div className="dashboard-stats" aria-live="polite">
          {isLoadingStats &&
            Array.from({ length: 7 }, (_, index) => (
              <article
                className="stat-card stat-card-skeleton"
                key={`stat-skeleton-${index}`}
                aria-label="Loading statistic"
              >
                <div className="stat-card-top">
                  <span className="dashboard-skeleton-line" />
                  <span className="dashboard-skeleton-icon" />
                </div>

                <span className="dashboard-skeleton-value" />

                <span className="dashboard-skeleton-description" />
              </article>
            ))}

          {!isLoadingStats &&
            !statsError &&
            statCards.map((card) => {
              const Icon = card.icon;

              return (
                <article
                  className={`stat-card stat-card-${card.variant}`}
                  key={card.label}
                >
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

          {!isLoadingStats && statsError && (
            <div className="dashboard-empty-state">
              <AlertCircle size={22} />
              <strong>Statistics could not be displayed</strong>
              <p>Retry the request to load the latest gym statistics.</p>
            </div>
          )}
        </div>
      </section>

      <section
        className="dashboard-grid"
        aria-label="Gym and account information"
      >
        <article className="dashboard-panel dashboard-panel-gym">
          <div className="dashboard-panel-header">
            <div>
              <span className="panel-label">YOUR BUSINESS</span>
              <h2>Current gym</h2>
            </div>

            <div className="dashboard-panel-header-icon">
              <ArrowUpRight size={19} strokeWidth={1.8} />
            </div>
          </div>

          {isLoadingGym && (
            <div className="dashboard-panel-loading" role="status">
              <span className="dashboard-skeleton-avatar" />
              <div className="dashboard-skeleton-details">
                <span className="dashboard-skeleton-line" />
                <span className="dashboard-skeleton-description" />
              </div>
            </div>
          )}

          {!isLoadingGym && gymError && (
            <div className="dashboard-panel-error" role="alert">
              <AlertCircle size={18} />
              <div>
                <strong>Gym information unavailable</strong>
                <p>{gymError}</p>
                <button
                  className="dashboard-inline-retry"
                  type="button"
                  onClick={retryDashboard}
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {!isLoadingGym && !gymError && gym && (
            <div className="gym-overview">
              <div className="gym-avatar">
                {gym.name.charAt(0).toUpperCase()}
              </div>

              <div className="gym-overview-details">
                <h3>{gym.name}</h3>

                <p>
                  {gym.city && gym.country
                    ? `${gym.city}, ${gym.country}`
                    : "Location not configured"}
                </p>

                <span className="gym-slug">/{gym.slug}</span>
              </div>
            </div>
          )}

          {!isLoadingGym && !gymError && !gym && (
            <div className="dashboard-empty-state dashboard-empty-state-compact">
              <p>No gym information is available for this account.</p>
            </div>
          )}
        </article>

        <article className="dashboard-panel dashboard-panel-account">
          <div className="dashboard-panel-header">
            <div>
              <span className="panel-label">SIGNED-IN USER</span>
              <h2>Your profile</h2>
            </div>
          </div>

          <div className="account-overview">
            <div className="account-avatar">
              {user?.name?.charAt(0).toUpperCase() ?? "U"}
            </div>

            <div className="account-overview-details">
              <strong>{user?.name ?? "Unknown user"}</strong>
              <span>{user?.email ?? "No email available"}</span>
              <small>{user?.role?.replace(/_/g, " ") ?? "USER"}</small>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
};

export default DashboardPage;
