import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  Ruler,
  ShieldAlert,
  UserRound,
  Weight,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { getMember } from "../api/member.api";
import type { Member, MemberStatus } from "../types/member.types";

const statusClassName: Record<MemberStatus, string> = {
  ACTIVE: "member-status member-status-active",
  INACTIVE: "member-status member-status-inactive",
  SUSPENDED: "member-status member-status-suspended",
};

const formatDate = (date?: string): string => {
  if (!date) {
    return "Not provided";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
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

const MemberProfilePage = () => {
  const { memberId } = useParams<{
    memberId: string;
  }>();

  const navigate = useNavigate();

  const [member, setMember] = useState<Member | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!memberId) {
      setError("Member ID is missing.");
      setLoading(false);
      return;
    }

    const loadMember = async (): Promise<void> => {
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
    };

    void loadMember();
  }, [memberId]);

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
    </section>
  );
};

export default MemberProfilePage;
