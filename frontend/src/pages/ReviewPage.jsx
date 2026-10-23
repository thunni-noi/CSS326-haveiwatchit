import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, Eye, LoaderCircle, MessageSquarePlus, Send, Star } from "lucide-react";
import PlaceholderCover from "../assets/placeholder_image.jpg";

const reviewPageSize = 10;
const watchlistStatuses = [
    { value: "wishlist", label: "Want to watch" },
    { value: "watching", label: "Watching" },
    { value: "watched", label: "Watched" },
    { value: "rewatching", label: "Rewatching" },
    { value: "on_hold", label: "On hold" },
    { value: "dropped", label: "Dropped" },
];

function ReviewPage({ user }) {
    const { id } = useParams();
    const [show, setShow] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [hasMoreReviews, setHasMoreReviews] = useState(false);
    const [loadingReviews, setLoadingReviews] = useState(true);
    const [watchlistItem, setWatchlistItem] = useState(null);
    const [watchlistLoaded, setWatchlistLoaded] = useState(!user);
    const [busy, setBusy] = useState(false);
    const [commentOpen, setCommentOpen] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [commentScore, setCommentScore] = useState(8);
    const [commentError, setCommentError] = useState("");
    const [commentSuccess, setCommentSuccess] = useState("");
    const [savingComment, setSavingComment] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const controller = new AbortController();
        axios.get(`/api/shows/${id}`, { signal: controller.signal })
            .then(({ data }) => setShow(data))
            .catch((requestError) => {
                if (!axios.isCancel(requestError)) {
                    setError(requestError.response?.data?.message || "Unable to load this title.");
                }
            });
        return () => controller.abort();
    }, [id]);

    const loadReviews = useCallback(async (offset, append = false) => {
        setLoadingReviews(true);
        try {
            const { data } = await axios.get(`/api/shows/${id}/reviews`, {
                params: { limit: reviewPageSize, offset },
            });
            setReviews((current) => append ? [...current, ...data.reviews] : data.reviews);
            setHasMoreReviews(Boolean(data.still_more));
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Unable to load reviews.");
        } finally {
            setLoadingReviews(false);
        }
    }, [id]);

    useEffect(() => {
        let active = true;

        axios.get(`/api/shows/${id}/reviews`, {
            params: { limit: reviewPageSize, offset: 0 },
        })
            .then(({ data }) => {
                if (!active) return;
                setReviews(data.reviews);
                setHasMoreReviews(Boolean(data.still_more));
            })
            .catch((requestError) => {
                if (active) setError(requestError.response?.data?.message || "Unable to load reviews.");
            })
            .finally(() => {
                if (active) setLoadingReviews(false);
            });

        return () => { active = false; };
    }, [id]);

    useEffect(() => {
        let active = true;
        if (user) {
            axios.get("/api/watchlist")
                .then(({ data }) => {
                    if (active) {
                        const item = data.items.find((entry) => Number(entry.show_id) === Number(id));
                        setWatchlistItem(item || null);
                    }
                })
                .catch(() => {})
                .finally(() => { if (active) setWatchlistLoaded(true); });
        }
        return () => { active = false; };
    }, [id, user]);

    const setWatchlistStatus = async (status) => {
        if (!show || busy) return;
        setBusy(true);
        setError("");
        try {
            if (watchlistItem) {
                await axios.put(`/api/watchlist/${id}`, { status });
                setWatchlistItem((current) => ({ ...current, status }));
            } else {
                await axios.post("/api/watchlist", { show_id: Number(id), status });
                setWatchlistItem({ show_id: Number(id), title: show.title, status });
            }
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Unable to update your watchlist.");
        } finally {
            setBusy(false);
        }
    };

    const submitComment = async (event) => {
        event.preventDefault();
        if (savingComment) return;
        setSavingComment(true);
        setCommentError("");
        setCommentSuccess("");
        setError("");
        try {
            await axios.post(`/api/shows/${id}/reviews`, {
                score: Number(commentScore),
                text: commentText,
            });
            setCommentText("");
            await Promise.all([
                loadReviews(0),
                axios.get(`/api/shows/${id}`).then(({ data }) => setShow(data)),
            ]);
            setCommentSuccess("Your review was posted and the rating has been updated.");
        } catch (requestError) {
            const message = requestError.response?.data?.message
                || (requestError.response?.status === 401
                    ? "Your login session is no longer valid. Sign out and sign in again."
                    : requestError.response?.status === 404
                        ? "Review API not found. Restart the backend, then try again."
                        : "Unable to save your comment.");
            setCommentError(message);
        } finally {
            setSavingComment(false);
        }
    };

    const status = watchlistItem?.status || "";

    return (
        <main className="min-h-screen px-4 pb-16 pt-8 text-white">
            <div className="mx-auto max-w-6xl">
                <Link to="/" className="inline-flex items-center gap-2 text-sm text-neutral-300 transition hover:text-white">
                    <ArrowLeft className="h-4 w-4" /> Back to home
                </Link>

                {error && <p role="alert" className="mt-5 rounded-lg border border-red-400/30 bg-red-950/50 px-4 py-3 text-sm text-red-200">{error}</p>}
                {!show ? (
                    <div className="flex justify-center py-24 text-[#EFAC61]"><LoaderCircle className="h-8 w-8 animate-spin" /></div>
                ) : (
                    <>
                        <section className="mt-6 grid gap-7 rounded-2xl border border-white/10 bg-neutral-950/60 p-5 sm:grid-cols-[220px_1fr] sm:p-8">
                            <img src={show.poster_url || PlaceholderCover} alt={`${show.title} poster`} className="mx-auto max-h-[330px] w-full max-w-[220px] rounded-xl object-cover shadow-xl" />
                            <div>
                                <p className="text-sm uppercase tracking-[0.18em] text-[#EFAC61]">{show.type?.replaceAll("_", " ") || "Title"}</p>
                                <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{show.title}</h1>
                                <p className="mt-3 text-sm text-neutral-400">
                                    {[show.release_year, show.status, show.content_rating].filter(Boolean).join(" · ") || "Details"}
                                    {show.duration ? ` · ${show.duration} min` : show.episode_count ? ` · ${show.episode_count} episodes` : ""}
                                </p>
                                <p className="mt-5 inline-flex items-center gap-2 text-neutral-200">
                                    <Star className="h-5 w-5 fill-[#EFAC61] text-[#EFAC61]" />
                                    {show.avg_score ?? "Not rated"} / 10 <span className="text-neutral-400">({show.review_count} reviews)</span>
                                </p>
                                <h2 className="mt-6 text-lg font-semibold">Synopsis</h2>
                                <p className="mt-2 whitespace-pre-line leading-7 text-neutral-300">{show.synopsis || "No description available."}</p>
                                {user ? (
                                    <div className="mt-6 flex flex-wrap items-center gap-3">
                                        <div className="inline-flex items-center gap-2 text-sm">
                                            <span className="inline-flex h-12 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 text-neutral-200">
                                                {status === "watched" ? <Check className="h-4 w-4 text-green-300" /> : <Eye className="h-4 w-4 text-[#EFAC61]" />}
                                                Watchlist
                                            </span>
                                            <label className="inline-flex h-12 items-center rounded-lg border border-white/10 bg-white/5 px-3 text-white">
                                                <span className="sr-only">Watchlist status</span>
                                                <select
                                                    aria-label="Watchlist status"
                                                    value={status}
                                                    disabled={busy || !watchlistLoaded}
                                                    onChange={(event) => setWatchlistStatus(event.target.value)}
                                                    className="min-w-28 bg-transparent text-white outline-none"
                                                >
                                                    <option value="" disabled className="bg-neutral-900">Add to list…</option>
                                                    {watchlistStatuses.map((option) => <option key={option.value} value={option.value} className="bg-neutral-900">{option.label}</option>)}
                                                </select>
                                            </label>
                                        </div>
                                        {status === "watched" && <span className="text-sm text-green-300">Marked as watched</span>}
                                    </div>
                                ) : (
                                    <p className="mt-6 text-sm text-neutral-300"><Link to="/login" className="text-[#EFAC61] hover:underline">Log in</Link> to sync this title with your watchlist.</p>
                                )}
                            </div>
                        </section>

                        <section id="reviews" className="mt-8 scroll-mt-24">
                            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/15 pb-3">
                                <div>
                                    <p className="text-sm uppercase tracking-[0.18em] text-[#EFAC61]">Community</p>
                                    <h2 className="mt-1 text-2xl font-bold">Reviews</h2>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-neutral-400">{show.review_count} total</span>
                                    {user ? (
                                        <button type="button" onClick={() => setCommentOpen((open) => !open)} className="inline-flex items-center gap-2 rounded-lg bg-[#EFAC61] px-4 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-[#f5bd7d]">
                                            <MessageSquarePlus className="h-4 w-4" /> Add comment
                                        </button>
                                    ) : (
                                        <Link to="/login" className="inline-flex items-center gap-2 rounded-lg bg-[#EFAC61] px-4 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-[#f5bd7d]">
                                            <MessageSquarePlus className="h-4 w-4" /> Add comment
                                        </Link>
                                    )}
                                </div>
                            </div>
                            {commentOpen && user && (
                                <form onSubmit={submitComment} className="mt-4 rounded-xl border border-white/10 bg-neutral-950/60 p-4 sm:p-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <span id="review-score-label" className="text-sm font-medium text-neutral-200">Your score</span>
                                        <div role="group" aria-labelledby="review-score-label" className="flex items-center gap-1">
                                            {Array.from({ length: 10 }, (_, index) => index + 1).map((score) => (
                                                <button key={score} type="button" onClick={() => setCommentScore(score)} aria-label={`${score} out of 10 stars`} aria-pressed={commentScore === score} className="rounded p-0.5 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#EFAC61]">
                                                    <Star className={`h-5 w-5 ${score <= commentScore ? "fill-[#EFAC61] text-[#EFAC61]" : "text-neutral-600"}`} />
                                                </button>
                                            ))}
                                            <span className="ml-2 text-sm text-neutral-300">{commentScore}/10</span>
                                        </div>
                                    </div>
                                    <label htmlFor="review-comment" className="mt-4 block text-sm font-medium text-neutral-200">Comment</label>
                                    <textarea id="review-comment" value={commentText} onChange={(event) => setCommentText(event.target.value)} maxLength={5000} required rows={4} placeholder="Share what you thought about this title…" className="mt-2 w-full resize-y rounded-lg border border-white/10 bg-white/5 p-3 text-sm leading-6 text-white outline-none placeholder:text-neutral-500 focus:border-[#EFAC61]" />
                                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                                        <span className="text-xs text-neutral-500">{commentText.length}/5000</span>
                                        <button type="submit" disabled={savingComment || !commentText.trim()} className="inline-flex items-center gap-2 rounded-lg bg-[#EFAC61] px-4 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-[#f5bd7d] disabled:cursor-not-allowed disabled:opacity-50">
                                            {savingComment ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                            {savingComment ? "Posting…" : "Post comment"}
                                        </button>
                                    </div>
                                    {commentError && <p role="alert" className="mt-3 rounded-lg border border-red-400/20 bg-red-950/40 px-3 py-2 text-sm text-red-200">{commentError}</p>}
                                    {commentSuccess && <p role="status" className="mt-3 rounded-lg border border-green-400/20 bg-green-950/30 px-3 py-2 text-sm text-green-200">{commentSuccess}</p>}
                                </form>
                            )}
                            {loadingReviews && reviews.length === 0 ? (
                                <div className="flex justify-center py-12 text-[#EFAC61]"><LoaderCircle className="h-6 w-6 animate-spin" /></div>
                            ) : reviews.length === 0 ? (
                                <p className="mt-5 rounded-xl border border-white/10 bg-neutral-950/50 p-6 text-neutral-300">No reviews yet.</p>
                            ) : (
                                <div className="mt-4 space-y-3">
                                    {reviews.map((review, index) => (
                                        <article key={`${review.username}-${review.created_at}-${index}`} className="rounded-xl border border-white/10 bg-neutral-950/55 p-5">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <h3 className="font-semibold">{review.username}</h3>
                                                <div className="flex items-center gap-3 text-sm text-neutral-400">
                                                    <span className="inline-flex items-center gap-1 text-[#EFAC61]"><Star className="h-4 w-4 fill-current" /> {review.score}/10</span>
                                                    <time>{review.created_at}</time>
                                                </div>
                                            </div>
                                            <p className="mt-3 whitespace-pre-line leading-6 text-neutral-300">{review.text}</p>
                                        </article>
                                    ))}
                                </div>
                            )}
                            {hasMoreReviews && (
                                <button type="button" disabled={loadingReviews} onClick={() => loadReviews(reviews.length, true)} className="mt-5 rounded-lg border border-[#66568f] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50">
                                    {loadingReviews ? "Loading…" : "Load more reviews"}
                                </button>
                            )}
                        </section>
                    </>
                )}
            </div>
        </main>
    );
}

export default ReviewPage;
