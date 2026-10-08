import {
  CheckCircle2,
  MoreHorizontal,
  Pencil,
  Plus,
  XCircle,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactElement,
} from "react";

import "./MembershipPlansPage.css";

import {
  createMembershipPlan,
  getMembershipPlans,
  updateMembershipPlan,
  updateMembershipPlanStatus,
} from "../api/membershipPlanApi";

import type { CreateMembershipPlanPayload, MembershipPlan } from "../types";

interface PlanFormState {
  name: string;
  description: string;
  durationDays: string;
  price: string;
}

const initialForm: PlanFormState = {
  name: "",
  description: "",
  durationDays: "30",
  price: "",
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDuration = (durationDays: number): string => {
  if (durationDays === 1) {
    return "1 day";
  }

  if (durationDays % 30 === 0) {
    const months = durationDays / 30;

    return `${months} ${months === 1 ? "month" : "months"}`;
  }

  if (durationDays % 7 === 0) {
    const weeks = durationDays / 7;

    return `${weeks} ${weeks === 1 ? "week" : "weeks"}`;
  }

  return `${durationDays} days`;
};

export const MembershipPlansPage = (): ReactElement => {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [includeInactive, setIncludeInactive] = useState(false);

  const [showModal, setShowModal] = useState(false);

  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);

  const [form, setForm] = useState<PlanFormState>(initialForm);

  const [saving, setSaving] = useState(false);

  const [actionPlanId, setActionPlanId] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getMembershipPlans(includeInactive);

      setPlans(result.plans);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load membership plans";

      setError(message);
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  const openCreateModal = (): void => {
    setEditingPlan(null);
    setForm(initialForm);
    setError(null);
    setShowModal(true);
  };

  const openEditModal = (plan: MembershipPlan): void => {
    setEditingPlan(plan);

    setForm({
      name: plan.name,
      description: plan.description ?? "",
      durationDays: String(plan.durationDays),
      price: String(plan.price),
    });

    setError(null);
    setShowModal(true);
  };

  const closeModal = (): void => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingPlan(null);
    setForm(initialForm);
  };

  const handleFormChange = (
    field: keyof PlanFormState,
    value: string,
  ): void => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    const durationDays = Number(form.durationDays);

    const price = Number(form.price);

    if (
      !form.name.trim() ||
      !Number.isInteger(durationDays) ||
      durationDays <= 0 ||
      price < 0
    ) {
      setError("Please provide valid membership plan details.");

      return;
    }

    const payload: CreateMembershipPlanPayload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      durationDays,
      price,
    };

    try {
      setSaving(true);
      setError(null);

      if (editingPlan) {
        await updateMembershipPlan(editingPlan.id, payload);
      } else {
        await createMembershipPlan(payload);
      }

      setShowModal(false);
      setEditingPlan(null);
      setForm(initialForm);

      await loadPlans();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to save membership plan";

      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (plan: MembershipPlan): Promise<void> => {
    const nextStatus = plan.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    try {
      setActionPlanId(plan.id);
      setError(null);

      await updateMembershipPlanStatus(plan.id, {
        status: nextStatus,
      });

      await loadPlans();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to update membership plan";

      setError(message);
    } finally {
      setActionPlanId(null);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Membership Plans</h1>

          <p>Create and manage the membership plans offered by your gym.</p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openCreateModal}
        >
          <Plus size={18} />
          Add Plan
        </button>
      </div>

      {error && <div className="page-error">{error}</div>}

      <div className="plans-toolbar">
        <label className="checkbox-control">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(event) => setIncludeInactive(event.target.checked)}
          />

          <span>Show inactive plans</span>
        </label>
      </div>

      {loading ? (
        <div className="empty-state">
          <p>Loading membership plans...</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="empty-state">
          <h3>No membership plans</h3>

          <p>
            Create your first membership plan to start assigning memberships to
            members.
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={openCreateModal}
          >
            <Plus size={18} />
            Create First Plan
          </button>
        </div>
      ) : (
        <div className="plans-grid">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`plan-card ${
                plan.status === "INACTIVE" ? "plan-card-inactive" : ""
              }`}
            >
              <div className="plan-card-header">
                <div>
                  <span
                    className={`status-badge ${
                      plan.status === "ACTIVE"
                        ? "status-active"
                        : "status-inactive"
                    }`}
                  >
                    {plan.status === "ACTIVE" ? (
                      <CheckCircle2 size={14} />
                    ) : (
                      <XCircle size={14} />
                    )}

                    {plan.status}
                  </span>

                  <h2>{plan.name}</h2>
                </div>

                <div className="plan-actions">
                  <button
                    type="button"
                    className="icon-button"
                    title="Edit plan"
                    onClick={() => openEditModal(plan)}
                  >
                    <Pencil size={17} />
                  </button>

                  <button
                    type="button"
                    className="icon-button"
                    title={
                      plan.status === "ACTIVE"
                        ? "Deactivate plan"
                        : "Activate plan"
                    }
                    onClick={() => void handleToggleStatus(plan)}
                    disabled={actionPlanId === plan.id}
                  >
                    <MoreHorizontal size={18} />
                  </button>
                </div>
              </div>

              <div className="plan-price">{formatCurrency(plan.price)}</div>

              <div className="plan-duration">
                {formatDuration(plan.durationDays)}
              </div>

              <p className="plan-description">
                {plan.description || "No description provided."}
              </p>

              <div className="plan-card-footer">
                <span>{plan.durationDays} days</span>

                <button
                  type="button"
                  className="text-button"
                  onClick={() => void handleToggleStatus(plan)}
                  disabled={actionPlanId === plan.id}
                >
                  {actionPlanId === plan.id
                    ? "Updating..."
                    : plan.status === "ACTIVE"
                      ? "Deactivate"
                      : "Activate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="membership-plan-modal-title"
          >
            <div className="modal-header">
              <div>
                <h2 id="membership-plan-modal-title">
                  {editingPlan
                    ? "Edit Membership Plan"
                    : "Create Membership Plan"}
                </h2>

                <p>Define the duration and pricing for this plan.</p>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close"
              >
                <XCircle size={20} />
              </button>
            </div>

            <form className="form-grid" onSubmit={handleSubmit}>
              <label className="form-field">
                <span>Plan name</span>

                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    handleFormChange("name", event.target.value)
                  }
                  placeholder="e.g. Premium"
                  maxLength={100}
                  required
                />
              </label>

              <label className="form-field">
                <span>Description</span>

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    handleFormChange("description", event.target.value)
                  }
                  placeholder="Describe what this plan includes..."
                  maxLength={500}
                  rows={4}
                />
              </label>

              <div className="form-row">
                <label className="form-field">
                  <span>Duration (days)</span>

                  <input
                    type="number"
                    min="1"
                    max="3650"
                    step="1"
                    value={form.durationDays}
                    onChange={(event) =>
                      handleFormChange("durationDays", event.target.value)
                    }
                    required
                  />
                </label>

                <label className="form-field">
                  <span>Price (BDT)</span>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.price}
                    onChange={(event) =>
                      handleFormChange("price", event.target.value)
                    }
                    placeholder="1500"
                    required
                  />
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingPlan
                      ? "Save Changes"
                      : "Create Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
