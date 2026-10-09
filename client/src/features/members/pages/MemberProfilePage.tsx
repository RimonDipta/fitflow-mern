import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  LoaderCircle,
  Mail,
  MapPin,
  Plus,
  Phone,
  Ruler,
  ShieldAlert,
  UserRound,
  Weight,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { getMember } from "../api/member.api";
import type { Member, MemberStatus } from "../types/member.types";

import {
  createMembership,
  getMemberships,
  updateMembership,
} from "../../memberships/api/membershipApi";

import { getMembershipPlans } from "../../membership-plans/api/membershipPlanApi";

import type {
  Membership,
  MembershipPaymentStatus,
} from "../../memberships/types";

import type { MembershipPlan } from "../../membership-plans/types";

import "./MemberProfilePage.css";

const statusClassName: Record<MemberStatus, string> = {
  ACTIVE: "member-status member-status-active",
  INACTIVE: "member-status member-status-inactive",
  SUSPENDED: "member-status member-status-suspended",
};

const paymentStatuses: MembershipPaymentStatus[] = [
  "PENDING",
  "PAID",
  "PARTIAL",
  "REFUNDED",
];

const formatDate = (date?: string): string => {
  if (!date) {
    return "Not provided";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not provided";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(parsedDate);
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatGender = (gender?: string): string => {
  if (!gender) {
    return "Not provided";
  }

  return gender
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatStatus = (status: string): string => {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const getLocalDateValue = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getMembershipStatusClass = (status: string): string => {
  return `membership-status membership-status-${status.toLowerCase()}`;
};

const getPaymentStatusClass = (status: string): string => {
  return `membership-payment membership-payment-${status.toLowerCase()}`;
};

const MemberProfilePage = () => {
  const { memberId } = useParams<{
    memberId: string;
  }>();

  const navigate = useNavigate();

  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [membershipsLoading, setMembershipsLoading] = useState(true);
  const [membershipError, setMembershipError] = useState("");
  const [planError, setPlanError] = useState("");

  const [showMembershipForm, setShowMembershipForm] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [startDate, setStartDate] = useState(getLocalDateValue());
  const [paymentStatus, setPaymentStatus] =
    useState<MembershipPaymentStatus>("PENDING");
  const [membershipNotes, setMembershipNotes] = useState("");

  const [creatingMembership, setCreatingMembership] = useState(false);
  const [updatingMembershipId, setUpdatingMembershipId] = useState<
    string | null
  >(null);

  const loadMember = useCallback(async (): Promise<void> => {
    if (!memberId) {
      setError("Member ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await getMember(memberId);

      setMember(result);
    } catch (requestError) {
      console.error("Failed to load member:", requestError);

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load member.",
      );
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  const loadMembershipData = useCallback(async (): Promise<void> => {
    if (!memberId) {
      setMembershipError("Member ID is missing.");
      setMembershipsLoading(false);
      return;
    }

    try {
      setMembershipsLoading(true);
      setMembershipError("");
      setPlanError("");

      const [membershipResult, planResult] = await Promise.all([
        getMemberships(memberId),
        getMembershipPlans(false),
      ]);

      setMemberships(membershipResult.memberships);
      setPlans(planResult.plans);
    } catch (requestError) {
      console.error("Failed to load membership data:", requestError);

      setMembershipError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load membership information.",
      );
    } finally {
      setMembershipsLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    void loadMember();
  }, [loadMember]);

  useEffect(() => {
    void loadMembershipData();
  }, [loadMembershipData]);

  const openMembershipForm = (): void => {
    setSelectedPlanId("");
    setStartDate(getLocalDateValue());
    setPaymentStatus("PENDING");
    setMembershipNotes("");
    setMembershipError("");
    setPlanError("");
    setShowMembershipForm(true);
  };

  const closeMembershipForm = (): void => {
    if (creatingMembership) {
      return;
    }

    setShowMembershipForm(false);
  };

  const handleCreateMembership = async (
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    if (!memberId || !selectedPlanId || !startDate) {
      setMembershipError("Select a plan and start date.");
      return;
    }

    try {
      setCreatingMembership(true);
      setMembershipError("");

      const normalizedStartDate = new Date(`${startDate}T00:00:00`);

      if (Number.isNaN(normalizedStartDate.getTime())) {
        setMembershipError("Please provide a valid start date.");
        return;
      }

      await createMembership({
        memberId,
        membershipPlanId: selectedPlanId,
        startDate: normalizedStartDate.toISOString(),
        paymentStatus,
        notes: membershipNotes.trim() || undefined,
      });

      setShowMembershipForm(false);
      setSelectedPlanId("");
      setMembershipNotes("");

      await loadMembershipData();
    } catch (requestError) {
      console.error("Failed to create membership:", requestError);

      setMembershipError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to assign membership.",
      );
    } finally {
      setCreatingMembership(false);
    }
  };

  const handlePaymentStatusChange = async (
    membership: Membership,
    nextStatus: MembershipPaymentStatus,
  ): Promise<void> => {
    if (membership.paymentStatus === nextStatus) {
      return;
    }

    try {
      setUpdatingMembershipId(membership.id);
      setMembershipError("");

      const updatedMembership = await updateMembership(membership.id, {
        paymentStatus: nextStatus,
      });

      setMemberships((current) =>
        current.map((item) =>
          item.id === updatedMembership.id ? updatedMembership : item,
        ),
      );
    } catch (requestError) {
      console.error("Failed to update payment status:", requestError);

      setMembershipError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update payment status.",
      );
    } finally {
      setUpdatingMembershipId(null);
    }
  };

  if (loading) {
    return (
      <section className="member-profile-page">
        <div className="member-profile-state">
          <LoaderCircle
            size={30}
            className="loading-spinner"
            strokeWidth={1.8}
          />

          <p>Loading member profile...</p>
        </div>
      </section>
    );
  }

  if (error || !member) {
    return (
      <section className="member-profile-page">
        <div className="member-profile-state member-profile-state-error">
          <div className="member-profile-error-icon">
            <UserRound size={25} />
          </div>

          <h2>Unable to load member</h2>

          <p>{error || "This member could not be found."}</p>

          <button
            type="button"
            className="member-primary-button"
            onClick={() => navigate("/members")}
          >
            <ArrowLeft size={16} />
            Back to members
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="member-profile-page">
      <Link to="/members" className="member-profile-back-link">
        <ArrowLeft size={16} />
        Back to members
      </Link>

      <div className="member-profile-header">
        <div className="member-profile-identity">
          <div className="member-profile-avatar">
            {member.name.charAt(0).toUpperCase()}
          </div>

          <div>
            <div className="member-profile-name-row">
              <h1>{member.name}</h1>

              <span className={statusClassName[member.status]}>
                {member.status}
              </span>
            </div>

            <p className="member-profile-code">{member.memberCode}</p>

            <p className="member-profile-joined">
              Member since {formatDate(member.joinedAt)}
            </p>
          </div>
        </div>
      </div>

      <div className="member-profile-grid">
        <section className="member-profile-card">
          <div className="member-profile-card-header">
            <div className="member-profile-card-icon">
              <UserRound size={17} />
            </div>

            <div>
              <h2>Personal information</h2>
              <p>Basic member details</p>
            </div>
          </div>

          <div className="member-profile-details">
            <div className="member-profile-detail">
              <span>Full name</span>
              <strong>{member.name}</strong>
            </div>

            <div className="member-profile-detail">
              <span>Gender</span>
              <strong>{formatGender(member.gender)}</strong>
            </div>

            <div className="member-profile-detail">
              <span>Date of birth</span>
              <strong>{formatDate(member.dateOfBirth)}</strong>
            </div>

            <div className="member-profile-detail">
              <span>Joined</span>
              <strong>{formatDate(member.joinedAt)}</strong>
            </div>
          </div>
        </section>

        <section className="member-profile-card">
          <div className="member-profile-card-header">
            <div className="member-profile-card-icon">
              <Phone size={17} />
            </div>

            <div>
              <h2>Contact information</h2>
              <p>How to reach this member</p>
            </div>
          </div>

          <div className="member-profile-details">
            <div className="member-profile-detail">
              <span>
                <Mail size={14} />
                Email
              </span>

              <strong>{member.email || "Not provided"}</strong>
            </div>

            <div className="member-profile-detail">
              <span>
                <Phone size={14} />
                Phone
              </span>

              <strong>{member.phone || "Not provided"}</strong>
            </div>

            <div className="member-profile-detail">
              <span>
                <MapPin size={14} />
                City
              </span>

              <strong>{member.city || "Not provided"}</strong>
            </div>

            <div className="member-profile-detail">
              <span>Country</span>

              <strong>{member.country || "Not provided"}</strong>
            </div>

            <div className="member-profile-detail member-profile-detail-full">
              <span>Address</span>

              <strong>{member.address || "Not provided"}</strong>
            </div>
          </div>
        </section>

        <section className="member-profile-card">
          <div className="member-profile-card-header">
            <div className="member-profile-card-icon">
              <Ruler size={17} />
            </div>

            <div>
              <h2>Body metrics</h2>
              <p>Current physical measurements</p>
            </div>
          </div>

          <div className="member-metric-grid">
            <div className="member-metric">
              <div className="member-metric-icon">
                <Ruler size={17} />
              </div>

              <span>Height</span>

              <strong>
                {member.height !== undefined
                  ? `${member.height} cm`
                  : "Not provided"}
              </strong>
            </div>

            <div className="member-metric">
              <div className="member-metric-icon">
                <Weight size={17} />
              </div>

              <span>Weight</span>

              <strong>
                {member.weight !== undefined
                  ? `${member.weight} kg`
                  : "Not provided"}
              </strong>
            </div>
          </div>
        </section>

        <section className="member-profile-card">
          <div className="member-profile-card-header">
            <div className="member-profile-card-icon">
              <ShieldAlert size={17} />
            </div>

            <div>
              <h2>Emergency contact</h2>
              <p>Contact in case of emergency</p>
            </div>
          </div>

          <div className="member-profile-details">
            <div className="member-profile-detail">
              <span>Name</span>

              <strong>{member.emergencyContactName || "Not provided"}</strong>
            </div>

            <div className="member-profile-detail">
              <span>Phone</span>

              <strong>{member.emergencyContactPhone || "Not provided"}</strong>
            </div>

            <div className="member-profile-detail">
              <span>Relation</span>

              <strong>
                {member.emergencyContactRelation || "Not provided"}
              </strong>
            </div>
          </div>
        </section>

        <section className="member-profile-card member-profile-card-full">
          <div className="member-profile-card-header">
            <div className="member-profile-card-icon">
              <CalendarDays size={17} />
            </div>

            <div>
              <h2>Notes</h2>
              <p>Internal notes for gym staff</p>
            </div>
          </div>

          <div className="member-profile-notes">
            {member.notes || "No notes have been added."}
          </div>
        </section>
      </div>

      <section className="member-subscriptions-section">
        <div className="member-subscriptions-header">
          <div>
            <h2>Memberships</h2>
            <p>
              Manage this member&apos;s plans, validity, and payment status.
            </p>
          </div>

          <button
            type="button"
            className="member-primary-button"
            onClick={openMembershipForm}
            disabled={plans.length === 0}
          >
            <Plus size={16} />
            Assign membership
          </button>
        </div>

        {membershipError && (
          <div className="membership-error" role="alert">
            {membershipError}
          </div>
        )}

        {membershipsLoading ? (
          <div className="membership-state">
            <LoaderCircle size={22} className="loading-spinner" />
            <span>Loading memberships...</span>
          </div>
        ) : memberships.length === 0 ? (
          <div className="membership-empty-state">
            <div className="membership-empty-icon">
              <CreditCard size={24} />
            </div>

            <h3>No memberships yet</h3>

            <p>
              Assign a membership plan to track this member&apos;s membership
              period and payment status.
            </p>

            <button
              type="button"
              className="member-primary-button"
              onClick={openMembershipForm}
              disabled={plans.length === 0}
            >
              <Plus size={16} />
              Assign first membership
            </button>

            {plans.length === 0 && (
              <p className="membership-hint">
                Create an active membership plan before assigning a membership.
              </p>
            )}
          </div>
        ) : (
          <div className="membership-list">
            {memberships.map((membership) => (
              <article key={membership.id} className="membership-card">
                <div className="membership-card-top">
                  <div className="membership-plan-identity">
                    <div className="membership-plan-icon">
                      <CreditCard size={20} />
                    </div>

                    <div>
                      <h3>{membership.plan.name}</h3>
                      <p>
                        {membership.plan.durationDays} days
                        {" · "}
                        {membership.member.memberCode}
                      </p>
                    </div>
                  </div>

                  <span className={getMembershipStatusClass(membership.status)}>
                    {formatStatus(membership.status)}
                  </span>
                </div>

                <div className="membership-card-details">
                  <div>
                    <span>Price</span>
                    <strong>{formatCurrency(membership.price)}</strong>
                  </div>

                  <div>
                    <span>Start date</span>
                    <strong>{formatDate(membership.startDate)}</strong>
                  </div>

                  <div>
                    <span>End date</span>
                    <strong>{formatDate(membership.endDate)}</strong>
                  </div>

                  <div>
                    <span>Payment</span>

                    <span
                      className={getPaymentStatusClass(
                        membership.paymentStatus,
                      )}
                    >
                      {formatStatus(membership.paymentStatus)}
                    </span>
                  </div>
                </div>

                {membership.notes && (
                  <p className="membership-card-notes">{membership.notes}</p>
                )}

                <div className="membership-card-footer">
                  <label>
                    <span>Update payment status</span>

                    <select
                      value={membership.paymentStatus}
                      onChange={(event) =>
                        void handlePaymentStatusChange(
                          membership,
                          event.target.value as MembershipPaymentStatus,
                        )
                      }
                      disabled={updatingMembershipId === membership.id}
                    >
                      {paymentStatuses.map((status) => (
                        <option key={status} value={status}>
                          {formatStatus(status)}
                        </option>
                      ))}
                    </select>
                  </label>

                  {updatingMembershipId === membership.id && (
                    <span className="membership-updating">Updating...</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {planError && (
          <div className="membership-error" role="alert">
            {planError}
          </div>
        )}
      </section>

      {showMembershipForm && (
        <div
          className="membership-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeMembershipForm();
            }
          }}
        >
          <div
            className="membership-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="membership-modal-title"
          >
            <div className="membership-modal-header">
              <div>
                <h2 id="membership-modal-title">Assign membership</h2>

                <p>Create a membership for {member.name}.</p>
              </div>

              <button
                type="button"
                className="membership-modal-close"
                onClick={closeMembershipForm}
                disabled={creatingMembership}
                aria-label="Close dialog"
              >
                ×
              </button>
            </div>

            <form className="membership-form" onSubmit={handleCreateMembership}>
              {membershipError && (
                <div className="membership-error" role="alert">
                  {membershipError}
                </div>
              )}

              <label className="membership-form-field">
                <span>Membership plan</span>

                <select
                  value={selectedPlanId}
                  onChange={(event) => setSelectedPlanId(event.target.value)}
                  required
                >
                  <option value="">Select a plan</option>

                  {plans
                    .filter((plan) => plan.status === "ACTIVE")
                    .map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} — {formatCurrency(plan.price)}
                        {" · "}
                        {plan.durationDays} days
                      </option>
                    ))}
                </select>
              </label>

              <label className="membership-form-field">
                <span>Start date</span>

                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  required
                />
              </label>

              <label className="membership-form-field">
                <span>Payment status</span>

                <select
                  value={paymentStatus}
                  onChange={(event) =>
                    setPaymentStatus(
                      event.target.value as MembershipPaymentStatus,
                    )
                  }
                >
                  {paymentStatuses.map((status) => (
                    <option key={status} value={status}>
                      {formatStatus(status)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="membership-form-field">
                <span>Notes (optional)</span>

                <textarea
                  value={membershipNotes}
                  onChange={(event) => setMembershipNotes(event.target.value)}
                  maxLength={2000}
                  rows={3}
                  placeholder="Add any relevant membership notes..."
                />
              </label>

              <div className="membership-modal-actions">
                <button
                  type="button"
                  className="membership-secondary-button"
                  onClick={closeMembershipForm}
                  disabled={creatingMembership}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="member-primary-button"
                  disabled={
                    creatingMembership ||
                    plans.filter((plan) => plan.status === "ACTIVE").length ===
                      0
                  }
                >
                  {creatingMembership ? (
                    <>
                      <LoaderCircle size={16} className="loading-spinner" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      Assign membership
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default MemberProfilePage;
