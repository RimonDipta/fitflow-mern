import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  Activity,
  AlertCircle,
  Check,
  Clock3,
  LogIn,
  LogOut,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";

import {
  checkInMember,
  checkOutMember,
  getAttendance,
  type AttendanceRecord,
} from "../api/attendance.api";
import { getMembers } from "../../members/api/member.api";
import type { Member } from "../../members/types/member.types";

import "./AttendancePage.css";

const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return (
      error.response?.data?.message ??
      error.message ??
      "The request could not be completed."
    );
  }

  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
};

const formatDateTime = (value: string): string =>
  new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

const formatDuration = (minutes: number | null): string => {
  if (minutes === null) {
    return "In progress";
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  return `${hours}h ${remainingMinutes}m`;
};

const AttendancePage = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchingMembers, setIsSearchingMembers] = useState(false);
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);
  const [busyAttendanceId, setBusyAttendanceId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const loadAttendance = useCallback(async () => {
    setError("");

    try {
      const result = await getAttendance(
        dateFilter || undefined,
        historySearch.trim() || undefined,
      );

      setRecords(result.records);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [dateFilter, historySearch]);

  useEffect(() => {
    void loadAttendance();
  }, [loadAttendance, reloadKey]);

  useEffect(() => {
    let cancelled = false;

    const loadMembers = async () => {
      setIsSearchingMembers(true);

      try {
        const result = await getMembers(1, 10, memberSearch.trim());

        if (!cancelled) {
          setMembers(
            result.members.filter((member) => member.status === "ACTIVE"),
          );
        }
      } catch (requestError) {
        if (!cancelled) {
          setMembers([]);
          setError(getErrorMessage(requestError));
        }
      } finally {
        if (!cancelled) {
          setIsSearchingMembers(false);
        }
      }
    };

    void loadMembers();

    return () => {
      cancelled = true;
    };
  }, [memberSearch]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setNotice("");
    setReloadKey((current) => current + 1);
  };

  const handleCheckIn = async (member: Member) => {
    setBusyMemberId(member.id);
    setError("");
    setNotice("");

    try {
      await checkInMember(member.id);
      setNotice(`${member.name} checked in successfully.`);
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusyMemberId(null);
    }
  };

  const handleCheckOut = async (record: AttendanceRecord) => {
    setBusyAttendanceId(record.id);
    setError("");
    setNotice("");

    try {
      await checkOutMember(record.id);
      setNotice(`${record.member.name} checked out successfully.`);
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusyAttendanceId(null);
    }
  };

  const openMemberIds = new Set(
    records
      .filter((record) => !record.checkOutAt)
      .map((record) => record.memberId),
  );

  const openSessions = records.filter((record) => !record.checkOutAt);
  const completedSessions = records.filter((record) =>
    Boolean(record.checkOutAt),
  );

  return (
    <main className="attendance-page">
      <header className="attendance-header">
        <div>
          <span className="attendance-eyebrow">GYM OPERATIONS</span>
          <h1>Attendance</h1>
          <p>Manage member check-ins, check-outs, and attendance history.</p>
        </div>

        <button
          type="button"
          className="attendance-button attendance-button-secondary"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw
            size={16}
            className={isRefreshing ? "attendance-spinning" : ""}
          />
          Refresh
        </button>
      </header>

      {error && (
        <div className="attendance-alert attendance-alert-error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {notice && (
        <div
          className="attendance-alert attendance-alert-success"
          role="status"
        >
          <Check size={18} />
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      <section className="attendance-stats" aria-label="Attendance summary">
        <article className="attendance-stat-card">
          <div className="attendance-stat-icon">
            <Activity size={20} />
          </div>
          <span>Records shown</span>
          <strong>{records.length}</strong>
          <small>Latest matching records, up to 100</small>
        </article>

        <article className="attendance-stat-card">
          <div className="attendance-stat-icon attendance-icon-active">
            <Users size={20} />
          </div>
          <span>Currently checked in</span>
          <strong>{openSessions.length}</strong>
          <small>Open sessions in the displayed results</small>
        </article>

        <article className="attendance-stat-card">
          <div className="attendance-stat-icon attendance-icon-complete">
            <Clock3 size={20} />
          </div>
          <span>Completed sessions</span>
          <strong>{completedSessions.length}</strong>
          <small>Sessions with a recorded check-out</small>
        </article>
      </section>

      <section className="attendance-panel">
        <div className="attendance-panel-heading">
          <div>
            <h2>Member check-in</h2>
            <p>Search for an active member to start an attendance session.</p>
          </div>
          <LogIn size={21} />
        </div>

        <label className="attendance-search">
          <Search size={17} />
          <input
            type="search"
            value={memberSearch}
            onChange={(event) => setMemberSearch(event.target.value)}
            placeholder="Search by member name or code..."
            aria-label="Search members"
          />
        </label>

        <div className="attendance-member-list">
          {isSearchingMembers ? (
            <div className="attendance-inline-state">Searching members...</div>
          ) : members.length === 0 ? (
            <div className="attendance-inline-state">
              {memberSearch.trim()
                ? "No active members found for this search."
                : "No active members found."}
            </div>
          ) : (
            members.map((member) => {
              const alreadyCheckedIn = openMemberIds.has(member.id);

              return (
                <article className="attendance-member-row" key={member.id}>
                  <div className="attendance-avatar" aria-hidden="true">
                    {member.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="attendance-member-details">
                    <strong>{member.name}</strong>
                    <span>{member.memberCode}</span>
                  </div>

                  {alreadyCheckedIn ? (
                    <span className="attendance-status attendance-status-open">
                      Checked in
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="attendance-button attendance-button-primary"
                      onClick={() => void handleCheckIn(member)}
                      disabled={
                        busyMemberId !== null || busyAttendanceId !== null
                      }
                    >
                      <LogIn size={15} />
                      {busyMemberId === member.id
                        ? "Checking in..."
                        : "Check in"}
                    </button>
                  )}
                </article>
              );
            })
          )}
        </div>
      </section>

      <section className="attendance-panel">
        <div className="attendance-panel-heading">
          <div>
            <h2>Attendance history</h2>
            <p>
              Review sessions and check out members who are still in the gym.
            </p>
          </div>
          <Clock3 size={21} />
        </div>

        <div className="attendance-filters">
          <label className="attendance-search attendance-history-search">
            <Search size={17} />
            <input
              type="search"
              value={historySearch}
              onChange={(event) => setHistorySearch(event.target.value)}
              placeholder="Search member or code..."
              aria-label="Search attendance history"
            />
          </label>

          <label className="attendance-date-filter">
            <span>Check-in date</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              aria-label="Filter attendance by date"
            />
          </label>

          {(historySearch || dateFilter) && (
            <button
              type="button"
              className="attendance-button attendance-button-secondary"
              onClick={() => {
                setHistorySearch("");
                setDateFilter("");
              }}
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="attendance-table-wrapper">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="attendance-table-state">
                    Loading attendance records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="attendance-table-state">
                    <div className="attendance-empty">
                      <Clock3 size={28} />
                      <strong>No attendance records found</strong>
                      <span>Check in a member to create the first record.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((record) => {
                  const isOpen = !record.checkOutAt;

                  return (
                    <tr key={record.id}>
                      <td>
                        <div className="attendance-table-member">
                          <strong>{record.member.name}</strong>
                          <span>{record.member.memberCode}</span>
                        </div>
                      </td>
                      <td>{formatDateTime(record.checkInAt)}</td>
                      <td>
                        {record.checkOutAt
                          ? formatDateTime(record.checkOutAt)
                          : "—"}
                      </td>
                      <td>{formatDuration(record.durationMinutes)}</td>
                      <td>
                        <span
                          className={`attendance-status ${
                            isOpen
                              ? "attendance-status-open"
                              : "attendance-status-complete"
                          }`}
                        >
                          {isOpen ? "Checked in" : "Completed"}
                        </span>
                      </td>
                      <td>
                        {isOpen ? (
                          <button
                            type="button"
                            className="attendance-button attendance-button-checkout"
                            onClick={() => void handleCheckOut(record)}
                            disabled={
                              busyAttendanceId !== null || busyMemberId !== null
                            }
                          >
                            <LogOut size={15} />
                            {busyAttendanceId === record.id
                              ? "Checking out..."
                              : "Check out"}
                          </button>
                        ) : (
                          <span className="attendance-action-complete">
                            <Check size={15} />
                            Done
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <footer className="attendance-table-footer">
          <span>
            Showing {records.length} record{records.length === 1 ? "" : "s"}.
            The API returns up to 100 matching records.
          </span>
        </footer>
      </section>
    </main>
  );
};

export default AttendancePage;
