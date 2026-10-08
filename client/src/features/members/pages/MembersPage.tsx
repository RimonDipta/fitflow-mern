import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Plus,
  Search,
  Users,
} from "lucide-react";

import { getMembers } from "../api/member.api";
import MemberFormModal from "../components/MemberFormModal";
import type { Member, MemberStatus } from "../types/member.types";

const PAGE_SIZE = 10;

const statusClassName: Record<MemberStatus, string> = {
  ACTIVE: "member-status member-status-active",
  INACTIVE: "member-status member-status-inactive",
  SUSPENDED: "member-status member-status-suspended",
};

const MembersPage = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadMembers = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError("");

      const result = await getMembers(page, PAGE_SIZE, activeSearch);

      setMembers(result.members);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (requestError) {
      console.error("Failed to load members:", requestError);

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load members.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, activeSearch]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  const handleSearchSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ): void => {
    event.preventDefault();

    setPage(1);
    setActiveSearch(search.trim());
  };

  const handleClearSearch = (): void => {
    setSearch("");
    setActiveSearch("");
    setPage(1);
  };

  const handleMemberCreated = (): void => {
    setPage(1);
    setActiveSearch("");
    setSearch("");
    void loadMembers();
  };

  const formatDate = (date: string): string => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };

  return (
    <section className="members-page">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">Member management</p>

          <h1 className="page-title">Members</h1>

          <p className="page-description">
            Manage your gym members, profiles, and membership status.
          </p>
        </div>

        <div className="members-header-actions">
          <div className="members-total">
            <Users size={18} strokeWidth={1.8} />
            <span>{total} members</span>
          </div>

          <button
            type="button"
            className="member-primary-button members-add-button"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={17} strokeWidth={2} />
            Add member
          </button>
        </div>
      </div>

      <div className="members-toolbar">
        <form className="member-search-form" onSubmit={handleSearchSubmit}>
          <Search size={18} strokeWidth={1.8} className="member-search-icon" />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email, phone, or member code..."
            aria-label="Search members"
          />

          <button type="submit">Search</button>
        </form>

        {activeSearch && (
          <button
            type="button"
            className="clear-search-button"
            onClick={handleClearSearch}
          >
            Clear
          </button>
        )}
      </div>

      <div className="members-card">
        {loading ? (
          <div className="members-state">
            <LoaderCircle
              size={28}
              className="loading-spinner"
              strokeWidth={1.8}
            />

            <p>Loading members...</p>
          </div>
        ) : error ? (
          <div className="members-state members-state-error">
            <h3>Unable to load members</h3>

            <p>{error}</p>

            <button
              type="button"
              className="retry-button"
              onClick={() => void loadMembers()}
            >
              Try again
            </button>
          </div>
        ) : members.length === 0 ? (
          <div className="members-state">
            <div className="members-empty-icon">
              <Users size={26} strokeWidth={1.7} />
            </div>

            <h3>{activeSearch ? "No members found" : "No members yet"}</h3>

            <p>
              {activeSearch
                ? `No members matched "${activeSearch}".`
                : "Members added to this gym will appear here."}
            </p>

            {!activeSearch && (
              <button
                type="button"
                className="member-primary-button"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={16} />
                Add your first member
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="members-table-wrapper">
              <table className="members-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Contact</th>
                    <th>Member Code</th>
                    <th>Status</th>
                    <th>Joined</th>
                  </tr>
                </thead>

                <tbody>
                  {members.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <div className="member-name-cell">
                          <div className="member-avatar">
                            {member.name.charAt(0).toUpperCase()}
                          </div>

                          <div>
                            <strong>{member.name}</strong>

                            <span>
                              {member.gender
                                ? member.gender.replaceAll("_", " ")
                                : "Gender not provided"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="member-contact-cell">
                          <span>{member.email || "No email"}</span>

                          <span>{member.phone || "No phone"}</span>
                        </div>
                      </td>

                      <td>
                        <span className="member-code">{member.memberCode}</span>
                      </td>

                      <td>
                        <span className={statusClassName[member.status]}>
                          {member.status}
                        </span>
                      </td>

                      <td>
                        <span className="member-date">
                          {formatDate(member.joinedAt)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="members-pagination">
              <span>
                Page {page} of {Math.max(totalPages, 1)}
              </span>

              <div className="pagination-buttons">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() =>
                    setPage((currentPage) => Math.max(1, currentPage - 1))
                  }
                  aria-label="Previous page"
                >
                  <ChevronLeft size={17} />
                </button>

                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() =>
                    setPage((currentPage) =>
                      Math.min(Math.max(totalPages, 1), currentPage + 1),
                    )
                  }
                  aria-label="Next page"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showCreateModal && (
        <MemberFormModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleMemberCreated}
        />
      )}
    </section>
  );
};

export default MembersPage;
