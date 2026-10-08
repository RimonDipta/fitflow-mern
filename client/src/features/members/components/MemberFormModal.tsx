import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { X } from "lucide-react";

import { createMember, updateMember } from "../api/member.api";
import type {
  CreateMemberPayload,
  Member,
  MemberGender,
} from "../types/member.types";

interface MemberFormModalProps {
  member?: Member;
  onClose: () => void;
  onSaved: () => void;
}

const MemberFormModal = ({
  member,
  onClose,
  onSaved,
}: MemberFormModalProps) => {
  const isEditing = Boolean(member);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<MemberGender | "">("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Bangladesh");
  const [address, setAddress] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [emergencyContactRelation, setEmergencyContactRelation] = useState("");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!member) {
      return;
    }

    setName(member.name);
    setEmail(member.email ?? "");
    setPhone(member.phone ?? "");
    setGender(member.gender ?? "");

    setDateOfBirth(member.dateOfBirth ? member.dateOfBirth.slice(0, 10) : "");

    setHeight(member.height !== undefined ? String(member.height) : "");

    setWeight(member.weight !== undefined ? String(member.weight) : "");

    setCity(member.city ?? "");
    setCountry(member.country ?? "Bangladesh");
    setAddress(member.address ?? "");
    setEmergencyContactName(member.emergencyContactName ?? "");
    setEmergencyContactPhone(member.emergencyContactPhone ?? "");
    setEmergencyContactRelation(member.emergencyContactRelation ?? "");
    setNotes(member.notes ?? "");
  }, [member]);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    if (!name.trim()) {
      setError("Member name is required.");
      return;
    }

    if (name.trim().length < 2) {
      setError("Member name must be at least 2 characters.");
      return;
    }

    if (email.trim() && !email.includes("@")) {
      setError("Please provide a valid email address.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const payload: CreateMemberPayload = {
        name: name.trim(),
        ...(email.trim() ? { email: email.trim() } : {}),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
        ...(gender ? { gender } : {}),
        ...(dateOfBirth
          ? {
              dateOfBirth: new Date(`${dateOfBirth}T00:00:00`).toISOString(),
            }
          : {}),
        ...(height ? { height: Number(height) } : {}),
        ...(weight ? { weight: Number(weight) } : {}),
        ...(city.trim() ? { city: city.trim() } : {}),
        ...(country.trim() ? { country: country.trim() } : {}),
        ...(address.trim() ? { address: address.trim() } : {}),
        ...(emergencyContactName.trim()
          ? {
              emergencyContactName: emergencyContactName.trim(),
            }
          : {}),
        ...(emergencyContactPhone.trim()
          ? {
              emergencyContactPhone: emergencyContactPhone.trim(),
            }
          : {}),
        ...(emergencyContactRelation.trim()
          ? {
              emergencyContactRelation: emergencyContactRelation.trim(),
            }
          : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      };

      if (member) {
        await updateMember(member.id, payload);
      } else {
        await createMember(payload);
      }

      onSaved();
      onClose();
    } catch (requestError) {
      console.error(
        `Failed to ${isEditing ? "update" : "create"} member:`,
        requestError,
      );

      setError(
        requestError instanceof Error
          ? requestError.message
          : `Unable to ${isEditing ? "update" : "create"} member.`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="member-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="member-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-form-title"
      >
        <div className="member-modal-header">
          <div>
            <p className="page-eyebrow">Member management</p>

            <h2 id="member-form-title">
              {isEditing ? "Edit member" : "Add member"}
            </h2>
          </div>

          <button
            type="button"
            className="member-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={19} />
          </button>
        </div>

        <form
          className="member-form"
          onSubmit={(event) => void handleSubmit(event)}
        >
          {error && <div className="member-form-error">{error}</div>}

          <div className="member-form-section">
            <h3>Basic information</h3>

            <div className="member-form-grid">
              <label className="member-form-field member-form-field-full">
                <span>Name *</span>

                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Rimon Dipta"
                  autoFocus
                />
              </label>

              <label className="member-form-field">
                <span>Email</span>

                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="member@example.com"
                />
              </label>

              <label className="member-form-field">
                <span>Phone</span>

                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+8801XXXXXXXXX"
                />
              </label>

              <label className="member-form-field">
                <span>Gender</span>

                <select
                  value={gender}
                  onChange={(event) =>
                    setGender(event.target.value as MemberGender | "")
                  }
                >
                  <option value="">Select gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                  <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                </select>
              </label>

              <label className="member-form-field">
                <span>Date of birth</span>

                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(event) => setDateOfBirth(event.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="member-form-section">
            <h3>Body metrics</h3>

            <div className="member-form-grid">
              <label className="member-form-field">
                <span>Height (cm)</span>

                <input
                  type="number"
                  min="1"
                  max="300"
                  value={height}
                  onChange={(event) => setHeight(event.target.value)}
                  placeholder="175"
                />
              </label>

              <label className="member-form-field">
                <span>Weight (kg)</span>

                <input
                  type="number"
                  min="1"
                  max="500"
                  value={weight}
                  onChange={(event) => setWeight(event.target.value)}
                  placeholder="70"
                />
              </label>
            </div>
          </div>

          <div className="member-form-section">
            <h3>Location</h3>

            <div className="member-form-grid">
              <label className="member-form-field">
                <span>City</span>

                <input
                  type="text"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="Dhaka"
                />
              </label>

              <label className="member-form-field">
                <span>Country</span>

                <input
                  type="text"
                  value={country}
                  onChange={(event) => setCountry(event.target.value)}
                  placeholder="Bangladesh"
                />
              </label>

              <label className="member-form-field member-form-field-full">
                <span>Address</span>

                <input
                  type="text"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="Street address"
                />
              </label>
            </div>
          </div>

          <div className="member-form-section">
            <h3>Emergency contact</h3>

            <div className="member-form-grid">
              <label className="member-form-field">
                <span>Name</span>

                <input
                  type="text"
                  value={emergencyContactName}
                  onChange={(event) =>
                    setEmergencyContactName(event.target.value)
                  }
                  placeholder="Emergency contact"
                />
              </label>

              <label className="member-form-field">
                <span>Phone</span>

                <input
                  type="tel"
                  value={emergencyContactPhone}
                  onChange={(event) =>
                    setEmergencyContactPhone(event.target.value)
                  }
                  placeholder="+8801XXXXXXXXX"
                />
              </label>

              <label className="member-form-field">
                <span>Relation</span>

                <input
                  type="text"
                  value={emergencyContactRelation}
                  onChange={(event) =>
                    setEmergencyContactRelation(event.target.value)
                  }
                  placeholder="Brother, sister, parent..."
                />
              </label>
            </div>
          </div>

          <div className="member-form-section">
            <h3>Notes</h3>

            <label className="member-form-field">
              <span>Additional notes</span>

              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Anything the gym staff should know..."
                rows={4}
              />
            </label>
          </div>

          <div className="member-modal-footer">
            <button
              type="button"
              className="member-secondary-button"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="member-primary-button"
              disabled={submitting}
            >
              {submitting
                ? isEditing
                  ? "Saving..."
                  : "Creating..."
                : isEditing
                  ? "Save changes"
                  : "Create member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MemberFormModal;
