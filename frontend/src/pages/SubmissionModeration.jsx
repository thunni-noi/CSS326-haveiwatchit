import { useEffect, useState } from "react";
import axios from "axios";
import { Check, LoaderCircle, RefreshCw } from "lucide-react";

const showStatuses = [
  { value: "upcoming", label: "Upcoming" },
  { value: "airing", label: "Airing" },
  { value: "completed", label: "Completed" },
];

const SubmissionModeration = ({ user }) => {
  const [submissions, setSubmissions] = useState([]);
  const [showStatusesById, setShowStatusesById] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reload, setReload] = useState(0);

  // Load pending requests whenever the reviewer refreshes the queue.
  useEffect(() => {
    const controller = new AbortController();
    axios.get("/api/submission-mod", { signal: controller.signal })
      .then(({ data }) => setSubmissions(data.submissions))
      .catch((requestError) => {
        if (!axios.isCancel(requestError)) {
          setError(requestError.response?.data?.message ?? "Unable to load show submissions.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [reload]);

  // Approve one request and add its submitted details to the show catalog.
  const approveSubmission = async (submission) => {
    setBusyId(submission.id);
    setError("");
    setNotice("");
    try {
      await axios.post(`/api/submission-mod/${submission.id}/approve`, {
        show_status: showStatusesById[submission.id] ?? "upcoming",
      });
      setSubmissions((current) => current.filter((item) => item.id !== submission.id));
      setNotice(`"${submission.name}" was approved and added to the catalog.`);
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to approve this submission.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="min-h-screen px-4 pb-16 pt-26 text-white sm:pt-30">
      <div className="mx-auto max-w-5xl rounded-2xl border border-white/10 bg-neutral-900/90 p-4 shadow-2xl shadow-black/30 sm:p-7">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Show submissions</h1>
            <p className="mt-2 text-sm text-neutral-400">
              Review requests and approve shows for the catalog. Signed in as{" "}
              <span className="font-medium text-neutral-200">{user?.username}</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setError("");
              setNotice("");
              setReload((current) => current + 1);
            }}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-neutral-700 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-600 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </header>

        {notice && (
          <p role="status" className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-950/70 p-3 text-sm text-emerald-200">
            {notice}
          </p>
        )}
        {error && (
          <p role="alert" className="mb-4 rounded-lg border border-rose-500/30 bg-rose-950/70 p-3 text-sm text-rose-200">
            {error}
          </p>
        )}

        {loading ? (
          <div role="status" className="flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-neutral-800 p-12 text-neutral-300">
            <LoaderCircle className="animate-spin" size={20} />
            Loading submissions…
          </div>
        ) : submissions.length ? (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <article key={submission.id} className="rounded-xl border border-white/10 bg-neutral-800 p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row">
                  {submission.photo_url && (
                    <img
                      src={submission.photo_url}
                      alt={`${submission.name} poster`}
                      className="h-36 w-24 rounded-lg object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-semibold">{submission.name}</h2>
                        <p className="mt-1 text-sm capitalize text-neutral-400">
                          {submission.type.replaceAll("_", " ")}
                          {submission.content_rating ? ` · ${submission.content_rating}` : ""}
                        </p>
                      </div>
                      <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200">
                        Pending
                      </span>
                    </div>
                    {submission.synopsis && (
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-neutral-200">
                        {submission.synopsis}
                      </p>
                    )}
                    {submission.other_details && (
                      <p className="mt-3 whitespace-pre-wrap rounded-lg bg-neutral-900/70 p-3 text-sm text-neutral-300">
                        {submission.other_details}
                      </p>
                    )}
                    <p className="mt-3 text-xs text-neutral-500">
                      Submitted by {submission.submitted_by_username}
                      {submission.created_at
                        ? ` · ${new Date(submission.created_at).toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-end justify-end gap-3 border-t border-white/10 pt-4">
                  <label className="text-sm text-neutral-300">
                    Catalog status
                    <select
                      value={showStatusesById[submission.id] ?? "upcoming"}
                      onChange={(event) => setShowStatusesById((current) => ({
                        ...current,
                        [submission.id]: event.target.value,
                      }))}
                      className="mt-1 block rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 text-white"
                    >
                      {showStatuses.map((status) => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => approveSubmission(submission)}
                    disabled={busyId === submission.id}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#EFAC61] px-4 py-2 text-sm font-semibold text-black hover:bg-[#ec9532] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busyId === submission.id
                      ? <LoaderCircle className="animate-spin" size={16} />
                      : <Check size={16} />}
                    {busyId === submission.id ? "Approving…" : "Approve and add show"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-white/10 bg-neutral-800 p-12 text-center text-sm text-neutral-400">
            There are no pending show submissions.
          </p>
        )}
      </div>
    </main>
  );
};

export default SubmissionModeration;
