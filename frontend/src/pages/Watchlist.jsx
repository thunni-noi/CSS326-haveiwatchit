import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
    Check,
    CircleHelp,
    Eye,
    ListFilter,
    LoaderCircle,
    Plus,
    Search,
    Star,
    Trash2,
    X,
} from "lucide-react";

const statuses = [
    { value: "wishlist", label: "Want to watch" },
    { value: "watching", label: "Watching" },
    { value: "watched", label: "Watched" },
    { value: "rewatching", label: "Rewatching" },
    { value: "on_hold", label: "On hold" },
    { value: "dropped", label: "Dropped" },
];

const formatType = (type) => ({
    movie: "Movie",
    series: "TV Series",
    tv_shows: "TV Series",
    anime: "Anime",
}[type] || type);

const formatDuration = (show) => {
    if (show.duration) return `${show.duration} min`;
    if (show.episode_count) return `${show.episode_count} episodes`;
    return null;
};

function WatchlistPage({ user }) {
    const [items, setItems] = useState([]);
    const [loadedUserId, setLoadedUserId] = useState(null);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("all");
    const [sort, setSort] = useState("updated");
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [resultQuery, setResultQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [addingId, setAddingId] = useState(null);
    const [selectedShow, setSelectedShow] = useState(null);
    const [busyId, setBusyId] = useState(null);

    useEffect(() => {
        if (!user) {
            return undefined;
        }

        const controller = new AbortController();
        axios.get("/api/watchlist", { signal: controller.signal })
            .then(({ data }) => setItems(data.items))
            .catch((requestError) => {
                if (!axios.isCancel(requestError)) {
                    setError(requestError.response?.data?.message || "Unable to load your watchlist.");
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoadedUserId(user.id);
            });

        return () => controller.abort();
    }, [user]);

    useEffect(() => {
        const searchTerm = query.trim();
        if (searchTerm.length < 2) {
            return undefined;
        }

        const controller = new AbortController();
        const timer = setTimeout(() => {
            setSearching(true);
            axios.get("/api/shows/search", {
                params: { q: searchTerm, limit: 8 },
                signal: controller.signal,
            })
                .then(({ data }) => {
                    const currentIds = new Set(items.map((item) => Number(item.show_id)));
                    setResults(data.filter((show) => !currentIds.has(Number(show.id))));
                    setResultQuery(searchTerm);
                })
                .catch((requestError) => {
                    if (!axios.isCancel(requestError)) {
                        setError(requestError.response?.data?.message || "Unable to search shows.");
                    }
                })
                .finally(() => {
                    if (!controller.signal.aborted) setSearching(false);
                });
        }, 250);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [query, items]);

    const filteredItems = useMemo(() => {
        const visible = items.filter((item) => filter === "all" || item.status === filter);
        return visible.sort((first, second) => {
            if (sort === "title") return first.title.localeCompare(second.title);
            if (sort === "rating") return (Number(second.avg_score) || 0) - (Number(first.avg_score) || 0);
            if (sort === "year") return (Number(second.release_year) || 0) - (Number(first.release_year) || 0);
            return new Date(second.updated_at) - new Date(first.updated_at);
        });
    }, [filter, items, sort]);

    const watchedCount = items.filter((item) => item.status === "watched").length;
    const watchedPercent = items.length ? Math.round((watchedCount / items.length) * 100) : 0;
    const currentResults = resultQuery === query.trim() ? results : [];
    const loading = Boolean(user && loadedUserId !== user.id);

    const addShow = async (show) => {
        setAddingId(show.id);
        setError("");
        try {
            await axios.post("/api/watchlist", { show_id: show.id, status: "wishlist" });
            const { data } = await axios.get("/api/watchlist");
            setItems(data.items);
            setQuery("");
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Unable to add this show to your watchlist.");
        } finally {
            setAddingId(null);
        }
    };

    const updateStatus = async (item, status) => {
        setBusyId(item.show_id);
        setError("");
        try {
            await axios.put(`/api/watchlist/${item.show_id}`, { status });
            const updatedAt = new Date().toISOString();
            setItems((current) => current.map((entry) =>
                entry.show_id === item.show_id
                    ? { ...entry, status, updated_at: updatedAt }
                    : entry
            ));
            setSelectedShow((current) => current?.show_id === item.show_id
                ? { ...current, status, updated_at: updatedAt }
                : current);
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Unable to update this watchlist item.");
        } finally {
            setBusyId(null);
        }
    };

    const removeShow = async (item) => {
        setBusyId(item.show_id);
        setError("");
        try {
            await axios.delete(`/api/watchlist/${item.show_id}`);
            setItems((current) => current.filter((entry) => entry.show_id !== item.show_id));
            setSelectedShow(null);
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Unable to remove this show.");
        } finally {
            setBusyId(null);
        }
    };

    return (
        <main className="min-h-screen pt-24 pb-16 text-white">
            <section className="border-y border-white/10 bg-linear-to-r from-[#251329]/95 via-[#30204a]/95 to-[#4a214b]/90">
                <div className="mx-auto max-w-5xl px-5 py-9 sm:px-8">
                    <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#EFAC61]">Your library</p>
                    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Your Watchlist</h1>
                    <p className="mt-2 text-sm text-neutral-300">Movies and TV shows you want to watch.</p>
                    <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-neutral-300">
                        <span className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#303969] text-sm font-bold text-white">
                                {user?.username?.charAt(0)?.toUpperCase() || "?"}
                            </span>
                            <span>Created by <span className="font-medium text-[#EFAC61]">{user?.username || "Guest"}</span></span>
                        </span>
                        <span>{items.length} {items.length === 1 ? "title" : "titles"}</span>
                        <span>You've watched {watchedPercent}%</span>
                    </div>
                </div>
            </section>

            <div className="mx-auto max-w-5xl px-5 sm:px-8">
                {!user ? (
                    <section className="mt-8 rounded-xl border border-white/10 bg-neutral-900/80 p-8 text-center">
                        <h2 className="text-xl font-semibold">Sign in to see your watchlist</h2>
                        <p className="mt-2 text-sm text-neutral-400">Your saved movies and shows will be waiting here.</p>
                        <Link to="/login" className="mt-5 inline-flex rounded-lg bg-[#303969] px-5 py-2.5 font-semibold text-white transition hover:bg-[#414b82]">
                            Sign in
                        </Link>
                    </section>
                ) : (
                    <>
                        <section className="flex flex-col gap-3 border-b border-white/10 py-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="relative w-full sm:max-w-sm">
                                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                                <input
                                    type="search"
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    placeholder="Add a movie or TV show..."
                                    aria-label="Search titles to add"
                                    className="h-10 w-full rounded-lg border border-white/10 bg-neutral-900/80 pl-9 pr-3 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-[#9596D6]"
                                />
                                {(searching || currentResults.length > 0) && (
                                    <div className="absolute left-0 right-0 top-12 z-30 overflow-hidden rounded-lg border border-white/10 bg-neutral-900 shadow-xl">
                                        {searching ? (
                                            <div className="flex items-center gap-2 p-4 text-sm text-neutral-400">
                                                <LoaderCircle className="h-4 w-4 animate-spin" /> Searching...
                                            </div>
                                        ) : currentResults.map((show) => (
                                            <div key={show.id} className="flex items-center gap-3 border-b border-white/5 p-2 last:border-0">
                                                <div className="h-12 w-9 shrink-0 overflow-hidden rounded bg-neutral-800">
                                                    {show.poster_url && <img src={show.poster_url} alt="" className="h-full w-full object-cover" />}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium">{show.title}</p>
                                                    <p className="text-xs text-neutral-400">{show.release_year || "Year unknown"} · {formatType(show.type)}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => addShow(show)}
                                                    disabled={addingId === show.id}
                                                    aria-label={`Add ${show.title} to watchlist`}
                                                    className="rounded-md p-2 text-[#EFAC61] transition hover:bg-white/10 disabled:opacity-50"
                                                >
                                                    {addingId === show.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {query.trim().length >= 2 && !searching && resultQuery === query.trim() && currentResults.length === 0 && !error && (
                                    <div className="absolute left-0 right-0 top-12 z-30 rounded-lg border border-white/10 bg-neutral-900 p-4 text-sm text-neutral-400 shadow-xl">
                                        No titles found to add.
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <label className="flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-neutral-900/80 px-3 text-sm text-neutral-400">
                                    <ListFilter className="h-4 w-4" />
                                    <span className="sr-only">Filter watchlist</span>
                                    <select value={filter} onChange={(event) => setFilter(event.target.value)} className="bg-transparent text-sm text-white outline-none">
                                        <option value="all">All titles</option>
                                        {statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                                    </select>
                                </label>
                                <label className="flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-neutral-900/80 px-3 text-sm text-neutral-400">
                                    <span>Sort</span>
                                    <select value={sort} onChange={(event) => setSort(event.target.value)} className="bg-transparent text-sm text-white outline-none">
                                        <option value="updated">Recently updated</option>
                                        <option value="title">Title</option>
                                        <option value="rating">Rating</option>
                                        <option value="year">Release year</option>
                                    </select>
                                </label>
                            </div>
                        </section>

                        {error && (
                            <div role="alert" className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-red-400/30 bg-red-950/50 px-4 py-3 text-sm text-red-200">
                                <span>{error}</span>
                                <button type="button" onClick={() => setError("")} aria-label="Dismiss error"><X className="h-4 w-4" /></button>
                            </div>
                        )}

                        {loading ? (
                            <div className="flex justify-center py-20 text-[#EFAC61]"><LoaderCircle className="h-8 w-8 animate-spin" /></div>
                        ) : items.length === 0 ? (
                            <section className="mt-6 rounded-xl border border-white/10 bg-neutral-900/70 px-6 py-16 text-center">
                                <ListFilter className="mx-auto h-9 w-9 text-neutral-500" />
                                <h2 className="mt-4 text-xl font-semibold">Your watchlist is empty</h2>
                                <p className="mt-2 text-sm text-neutral-400">Search for a movie or show above and add it to your list.</p>
                            </section>
                        ) : filteredItems.length === 0 ? (
                            <p className="py-12 text-center text-sm text-neutral-400">No titles match this filter.</p>
                        ) : (
                            <section className="mt-5 overflow-hidden rounded-xl border border-white/10 bg-neutral-950/65">
                                {filteredItems.map((item, index) => (
                                    <article key={item.show_id} className={`p-4 sm:p-5 ${index ? "border-t border-white/10" : ""}`}>
                                        <div className="flex gap-4">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedShow(item)}
                                                className="relative h-28 w-[4.5rem] shrink-0 overflow-hidden rounded-lg bg-neutral-800 text-left sm:h-32 sm:w-[5.25rem]"
                                                aria-label={`View details for ${item.title}`}
                                            >
                                                {item.poster_url ? (
                                                    <img src={item.poster_url} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    <span className="flex h-full items-center justify-center px-1 text-center text-xs text-neutral-500">No poster</span>
                                                )}
                                                {item.status === "watched" && (
                                                    <span className="absolute left-0 top-0 rounded-br-lg bg-[#EFAC61] p-1.5 text-neutral-950"><Check className="h-4 w-4" /></span>
                                                )}
                                            </button>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <button type="button" onClick={() => setSelectedShow(item)} className="text-left text-base font-semibold hover:text-[#EFAC61] sm:text-lg">
                                                            {index + 1}. {item.title}
                                                        </button>
                                                        <p className="mt-1 text-sm text-neutral-400">
                                                            {item.release_year || "Year unknown"} <span className="px-1">·</span> {formatType(item.type)}
                                                            {formatDuration(item) && <> <span className="px-1">·</span> {formatDuration(item)}</>}
                                                            {item.content_rating && <> <span className="px-1">·</span> {item.content_rating}</>}
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedShow(item)}
                                                        aria-label={`More information about ${item.title}`}
                                                        className="rounded-full p-1.5 text-[#9596D6] transition hover:bg-white/10 hover:text-white"
                                                    >
                                                        <CircleHelp className="h-5 w-5" />
                                                    </button>
                                                </div>
                                                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                                                    <span className="inline-flex items-center gap-1 text-neutral-300">
                                                        <Star className="h-4 w-4 fill-[#EFAC61] text-[#EFAC61]" />
                                                        {item.avg_score ? `${Number(item.avg_score).toFixed(1)}${item.review_count ? ` (${item.review_count})` : ""}` : "Not rated"}
                                                    </span>
                                                    <label className="flex items-center gap-1.5 text-[#9596D6]">
                                                        <span className="sr-only">Status for {item.title}</span>
                                                        <select
                                                            value={item.status}
                                                            disabled={busyId === item.show_id}
                                                            onChange={(event) => updateStatus(item, event.target.value)}
                                                            className="max-w-40 rounded bg-transparent py-1 text-sm outline-none focus:ring-1 focus:ring-[#9596D6]"
                                                        >
                                                            {statuses.map((status) => <option key={status.value} value={status.value} className="bg-neutral-900">{status.label}</option>)}
                                                        </select>
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateStatus(item, item.status === "watched" ? "wishlist" : "watched")}
                                                        disabled={busyId === item.show_id}
                                                        className="inline-flex items-center gap-1.5 text-[#9596D6] transition hover:text-white disabled:opacity-50"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        {item.status === "watched" ? "Mark as unwatched" : "Mark as watched"}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeShow(item)}
                                                        disabled={busyId === item.show_id}
                                                        aria-label={`Remove ${item.title} from watchlist`}
                                                        className="inline-flex items-center gap-1 text-neutral-500 transition hover:text-red-300 disabled:opacity-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        <span className="sr-only sm:not-sr-only">Remove</span>
                                                    </button>
                                                </div>
                                                {item.synopsis && <p className="mt-3 line-clamp-2 text-sm leading-6 text-neutral-300">{item.synopsis}</p>}
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </section>
                        )}
                    </>
                )}
            </div>

            {selectedShow && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) setSelectedShow(null);
                    }}
                >
                    <section role="dialog" aria-modal="true" aria-labelledby="watchlist-detail-title" className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#1c1c20] p-5 shadow-2xl sm:p-7">
                        <button type="button" onClick={() => setSelectedShow(null)} aria-label="Close details" className="absolute right-4 top-4 rounded-full p-2 text-neutral-400 hover:bg-white/10 hover:text-white">
                            <X className="h-5 w-5" />
                        </button>
                        <div className="flex gap-4 pr-8">
                            <div className="h-32 w-[5.25rem] shrink-0 overflow-hidden rounded-lg bg-neutral-800">
                                {selectedShow.poster_url && <img src={selectedShow.poster_url} alt="" className="h-full w-full object-cover" />}
                            </div>
                            <div>
                                <h2 id="watchlist-detail-title" className="text-xl font-bold sm:text-2xl">{selectedShow.title}</h2>
                                <p className="mt-1 text-sm text-neutral-400">
                                    {selectedShow.release_year || "Year unknown"} · {formatType(selectedShow.type)}
                                    {formatDuration(selectedShow) && ` · ${formatDuration(selectedShow)}`}
                                </p>
                                <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-neutral-300">
                                    <Star className="h-4 w-4 fill-[#EFAC61] text-[#EFAC61]" />
                                    {selectedShow.avg_score ? `${Number(selectedShow.avg_score).toFixed(1)} / 10` : "Not rated"}
                                </p>
                            </div>
                        </div>
                        <p className="mt-5 text-sm leading-6 text-neutral-200">{selectedShow.synopsis || "No description available for this title."}</p>
                        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                            <label className="flex flex-1 items-center justify-between gap-3 rounded-full bg-neutral-800 px-5 py-3 text-sm font-semibold text-[#9596D6]">
                                Watchlist status
                                <select
                                    value={selectedShow.status}
                                    disabled={busyId === selectedShow.show_id}
                                    onChange={(event) => updateStatus(selectedShow, event.target.value)}
                                    className="max-w-36 bg-transparent text-right text-white outline-none"
                                >
                                    {statuses.map((status) => <option key={status.value} value={status.value} className="bg-neutral-900">{status.label}</option>)}
                                </select>
                            </label>
                            <button
                                type="button"
                                onClick={() => removeShow(selectedShow)}
                                disabled={busyId === selectedShow.show_id}
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-neutral-800 px-5 py-3 text-sm font-semibold text-neutral-200 transition hover:bg-red-950 hover:text-red-200 disabled:opacity-50"
                            >
                                <Trash2 className="h-4 w-4" /> Remove from watchlist
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </main>
    );
}

export default WatchlistPage;