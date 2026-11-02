// Shared searchable record list for the User, Show, and Submission admin tabs.
// Renders loading/empty states, record cards, edit/delete actions, and pagination.
import {
  BookMarked,
  CircleUserRound,
  ChevronLeft,
  ChevronRight,
  ListVideo,
  Trash2,
} from "lucide-react";
import UserProfile from "../../components/UserProfile";
import { displayValue, getRecordKey, PAGE_SIZE } from "./adminUtils";

const AdminRecords = ({ recordsProps }) => {
  // Collect the list data, current edit state, and callbacks supplied by the parent.
  const {
    form,
    isInlineEdit,
    renderEditor,
    loading,
    records,
    submissionUsers,
    keys,
    selectedEntity,
    setShowAssociations,
    setSelectedShow,
    openWatchlist,
    openCollections,
    startEdit,
    removeRecord,
    visibleFields,
    search,
    page,
    setPage,
    total,
  } = recordsProps;

  return (
    <>
          {/* Show the standalone create/edit form unless it belongs inside a record card. */}
          {form && !isInlineEdit(form.record) && renderEditor()}

          {/* Render loading, empty, or populated states for the current entity. */}
          {loading ? (
            <p role="status" className="rounded-xl border border-white/10 bg-neutral-800 p-8 text-center text-sm text-neutral-400">Loading records…</p>
          ) : records.length ? (
            <div className="space-y-3">
              {records.map((record) => {
                const key = getRecordKey(record, keys);
                // Resolve the submission's stored user ID to the user's display information.
                const submissionUser = selectedEntity.name === "show_submission"
                  ? submissionUsers?.find(
                    (user) => Number(user.id) === Number(record.submitted_by),
                  )
                  : null;
                // User-only role/status badges are omitted for shows and submissions.
                const userFlairs = selectedEntity.name === "users"
                  ? [
                    record.role === "admin" && {
                      label: "Admin",
                      className: "bg-green-800/15 text-green-200",
                    },
                    record.role === "moderator" && {
                      label: "Moderator",
                      className: "bg-[#EFAC61]/15 text-[#EFAC61]",
                    },
                    (record.is_verified === true || record.is_verified === 1) && {
                      label: "Verified",
                      className: "bg-sky-500/15 text-sky-300",
                    },
                    (record.is_suspended === true || record.is_suspended === 1) && {
                      label: "Suspended",
                      className: "bg-rose-500/15 text-rose-300",
                    },
                  ].filter(Boolean)
                  : [];
                return (
                  <article key={JSON.stringify(key)} className="overflow-hidden rounded-xl border border-white/10 bg-neutral-800">
                    <header className="flex items-center gap-3 border-b border-white/10 bg-neutral-800 px-4 py-2">
                      {selectedEntity.name === "users"
                        ? <UserProfile
                          user={record}
                          className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-700 text-neutral-300"
                        />
                        : <CircleUserRound aria-hidden="true" size={18} />}
                      <h3 className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-sm font-semibold">
                        <span className="min-w-0 truncate">
                          {record.username ?? record.name ?? record.email ?? keys.map((name) => `${name} ${record[name]}`).join(" · ")}
                        </span>
                        {userFlairs.length > 0 && (
                          <span className="flex flex-wrap gap-1.5">
                            {userFlairs.map((flair) => (
                              <span
                                key={flair.label}
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${flair.className}`}
                              >
                                {flair.label}
                              </span>
                            ))}
                          </span>
                        )}
                      </h3>
                      {selectedEntity.name === "shows" && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowAssociations(null);
                            setSelectedShow(record);
                          }}
                          className="rounded-lg bg-neutral-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-600"
                        >
                          Details
                        </button>
                      )}
                      {selectedEntity.name === "users" && (
                        <>
                          <button
                            type="button"
                            onClick={() => openWatchlist(record)}
                            className="inline-flex items-center gap-2 rounded-lg bg-[#3336cc] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#060863]"
                          >
                            <ListVideo size={16} />
                            Watchlist
                          </button>
                          <button
                            type="button"
                            onClick={() => openCollections(record)}
                            className="inline-flex items-center gap-2 rounded-lg bg-neutral-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-neutral-600"
                          >
                            <BookMarked size={16} />
                            Collections
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => startEdit(record)}
                        className="rounded-lg bg-[#EFAC61] px-4 py-1.5 text-sm font-semibold text-black hover:bg-[#ec9532]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete record ${JSON.stringify(key)}`}
                        onClick={() => removeRecord(record)}
                        className="rounded-lg bg-rose-950 p-2 text-rose-300 hover:bg-rose-900"
                      >
                        <Trash2 size={15} />
                      </button>
                    </header>
                    {/* Keep edits in the selected record card; otherwise show its readable fields. */}
                    {isInlineEdit(record) ? (
                      <div className="p-4">
                        {renderEditor()}
                      </div>
                    ) : (
                      <>
                        {selectedEntity.name === "shows" && record.photo_url && (
                          <div className="px-4 pt-4">
                            <img src={record.photo_url} alt={`${record.name} poster`} className="h-36 w-24 rounded-lg object-cover shadow" />
                          </div>
                        )}
                        <dl className="grid gap-x-5 gap-y-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                          {visibleFields.map((field) => (
                            <div key={field.name} className="min-w-0">
                              <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                                {field.name.replaceAll("_", " ")}
                              </dt>
                              {/* Show a readable submitter name instead of the foreign-key ID. */}
                              <dd className="mt-1 break-words text-sm text-neutral-200">
                                {selectedEntity.name === "show_submission" && field.name === "submitted_by"
                                  ? submissionUser
                                    ? `${submissionUser.username} (${submissionUser.email})`
                                    : displayValue(record[field.name], field.type)
                                  : displayValue(record[field.name], field.type)}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="rounded-xl border border-white/10 bg-neutral-800 p-8 text-center text-sm text-neutral-400">
              {search ? `No ${selectedEntity?.label.toLowerCase()} match “${search}”.` : `No ${selectedEntity?.label.toLowerCase()} yet.`}
            </p>
          )}

          {/* Show the result range and page controls for the current 50-record page. */}
          <footer className="mt-5 flex items-center justify-between gap-3 text-sm text-neutral-400">
            <span>{total ? `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, total)} of ${total}` : "0 records"}</span>
            <div className="flex gap-2">
              <button
                type="button"
                aria-label="Previous page"
                disabled={page === 0 || loading}
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                className="rounded-lg bg-neutral-800 p-2 text-white hover:bg-neutral-700 disabled:opacity-40"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                aria-label="Next page"
                disabled={(page + 1) * PAGE_SIZE >= total || loading}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-lg bg-neutral-800 p-2 text-white hover:bg-neutral-700 disabled:opacity-40"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </footer>
    </>
  );
};

export default AdminRecords;
