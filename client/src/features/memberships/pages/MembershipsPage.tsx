import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from "react";
import {
  ArrowUpRight,
  CreditCard,
  LoaderCircle,
  Search,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import { getMemberships, updateMembership } from "../api/membershipApi";

import type {
  Membership,
  MembershipPaymentStatus,
  MembershipStatus,
} from "../types";

import "./MembershipsPage.css";

type StatusFilter = "ALL" | MembershipStatus;
type PaymentFilter = "ALL" | MembershipPaymentStatus;

const membershipStatuses: StatusFilter[] = [
  "ALL",
  "ACTIVE",
  "EXPIRED",
  "CANCELLED",
];

const paymentStatuses: PaymentFilter[] = [
  "ALL",
  "PENDING",
  "PAID",
  "PARTIAL",
  "REFUNDED",
];

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(amount);

const formatDate = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatLabel = (value: string): string =>
  value.charAt(0) + value.slice(1).toLowerCase();

const MembershipsPage = (): ReactElement => {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadMemberships = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError("");

      const result = await getMemberships();

      setMemberships(result.memberships);
    } catch (requestError) {
      console.error("Failed to load memberships:", requestError);

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load memberships.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMemberships();
  }, [loadMemberships]);

  const filteredMemberships = useMemo(() => {
    const query = search.trim().toLowerCase();

    return memberships.filter((membership) => {
      const matchesSearch =
        !query ||
        membership.member.name.toLowerCase().includes(query) ||
        membership.member.memberCode.toLowerCase().includes(query) ||
        membership.plan.name.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "ALL" || membership.status === statusFilter;

      const matchesPayment =
        paymentFilter === "ALL" || membership.paymentStatus === paymentFilter;

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [memberships, search, statusFilter, paymentFilter]);

  const summary = useMemo(() => {
    return {
      total: memberships.length,
      active: memberships.filter((membership) => membership.status === "ACTIVE")
        .length,
      pending: memberships.filter(
        (membership) => membership.paymentStatus === "PENDING",
      ).length,
      revenue: memberships
        .filter(
          (membership) =>
            membership.paymentStatus === "PAID" &&
            membership.status !== "CANCELLED",
        )
        .reduce((total, membership) => total + membership.price, 0),
    };
  }, [memberships]);

  const handlePaymentChange = async (
    membership: Membership,
    nextStatus: MembershipPaymentStatus,
  ): Promise<void> => {
    if (membership.paymentStatus === nextStatus) {
      return;
    }

    try {
      setUpdatingId(membership.id);
      setError("");

      const updated = await updateMembership(membership.id, {
        paymentStatus: nextStatus,
      });

      setMemberships((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (requestError) {
      console.error("Failed to update payment status:", requestError);

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update payment status.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section className="memberships-page">
      <header className="memberships-page-header">
        <div>
          <h1>Memberships</h1>
          <p>
            Track member subscriptions, membership periods, and payment status.
          </p>
        </div>

        <div className="memberships-header-count">
          <CreditCard size={17} />
          <span>{memberships.length} records</span>
        </div>
      </header>

      {error && (
        <div className="memberships-error" role="alert">
          {error}
          <button type="button" onClick={() => void loadMemberships()}>
            Retry
          </button>
        </div>
      )}

      <div className="memberships-summary-grid">
        <article className="memberships-summary-card">
          <div className="memberships-summary-icon">
            <CreditCard size={19} />
          </div>
          <span>Total memberships</span>
          <strong>{summary.total}</strong>
        </article>

        <article className="memberships-summary-card">
          <div className="memberships-summary-icon">
            <Users size={19} />
          </div>
          <span>Active memberships</span>
          <strong>{summary.active}</strong>
        </article>

        <article className="memberships-summary-card">
          <div className="memberships-summary-icon">
            <LoaderCircle size={19} />
          </div>
          <span>Pending payments</span>
          <strong>{summary.pending}</strong>
        </article>

        <article className="memberships-summary-card">
          <div className="memberships-summary-icon">
            <CreditCard size={19} />
          </div>
          <span>Paid membership value</span>
          <strong>{formatCurrency(summary.revenue)}</strong>
          <small>Based on records marked PAID; not a payment ledger.</small>
        </article>
      </div>

      <div className="memberships-toolbar">
        <label className="memberships-search">
          <Search size={17} />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search member, code, or plan..."
          />
        </label>

        <label className="memberships-filter">
          <span>Membership status</span>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as StatusFilter)
            }
          >
            {membershipStatuses.map((status) => (
              <option key={status} value={status}>
                {status === "ALL" ? "All statuses" : formatLabel(status)}
              </option>
            ))}
          </select>
        </label>

        <label className="memberships-filter">
          <span>Payment status</span>

          <select
            value={paymentFilter}
            onChange={(event) =>
              setPaymentFilter(event.target.value as PaymentFilter)
            }
          >
            {paymentStatuses.map((status) => (
              <option key={status} value={status}>
                {status === "ALL" ? "All payments" : formatLabel(status)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="memberships-table-container">
        {loading ? (
          <div className="memberships-state">
            <LoaderCircle size={25} className="loading-spinner" />
            <span>Loading memberships...</span>
          </div>
        ) : filteredMemberships.length === 0 ? (
          <div className="memberships-state">
            <CreditCard size={27} />
            <h3>No memberships found</h3>
            <p>
              {memberships.length === 0
                ? "Memberships will appear here after you assign a plan to a member."
                : "Try changing your search or filters."}
            </p>
          </div>
        ) : (
          <div className="memberships-table-scroll">
            <table className="memberships-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Plan</th>
                  <th>Validity</th>
                  <th>Price</th>
                  <th>Membership</th>
                  <th>Payment</th>
                  <th>Update payment</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>

              <tbody>
                {filteredMemberships.map((membership) => (
                  <tr key={membership.id}>
                    <td>
                      <Link
                        className="memberships-member-link"
                        to={`/members/${membership.memberId}`}
                      >
                        <span>{membership.member.name}</span>
                        <small>{membership.member.memberCode}</small>
                      </Link>
                    </td>

                    <td>
                      <strong>{membership.plan.name}</strong>
                      <small>{membership.plan.durationDays} days</small>
                    </td>

                    <td>
                      <span>{formatDate(membership.startDate)}</span>
                      <small>to {formatDate(membership.endDate)}</small>
                    </td>

                    <td className="memberships-price">
                      {formatCurrency(membership.price)}
                    </td>

                    <td>
                      <span
                        className={`memberships-badge memberships-status-${membership.status.toLowerCase()}`}
                      >
                        {formatLabel(membership.status)}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`memberships-badge memberships-payment-${membership.paymentStatus.toLowerCase()}`}
                      >
                        {formatLabel(membership.paymentStatus)}
                      </span>
                    </td>

                    <td>
                      <select
                        className="memberships-payment-select"
                        value={membership.paymentStatus}
                        onChange={(event) =>
                          void handlePaymentChange(
                            membership,
                            event.target.value as MembershipPaymentStatus,
                          )
                        }
                        disabled={updatingId === membership.id}
                        aria-label={`Payment status for ${membership.member.name}`}
                      >
                        {paymentStatuses
                          .filter(
                            (status): status is MembershipPaymentStatus =>
                              status !== "ALL",
                          )
                          .map((status) => (
                            <option key={status} value={status}>
                              {formatLabel(status)}
                            </option>
                          ))}
                      </select>

                      {updatingId === membership.id && <small>Saving...</small>}
                    </td>

                    <td>
                      <Link
                        to={`/members/${membership.memberId}`}
                        className="memberships-open-link"
                        aria-label={`Open ${membership.member.name}'s profile`}
                        title="Open member profile"
                      >
                        <ArrowUpRight size={17} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && (
        <p className="memberships-results-count">
          Showing {filteredMemberships.length} of {memberships.length}{" "}
          memberships
        </p>
      )}
    </section>
  );
};

export default MembershipsPage;
