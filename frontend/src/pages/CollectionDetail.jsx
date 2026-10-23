import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BookMarked, Globe, Lock, Trash2, Plus, Search, LoaderCircle } from "lucide-react";

const CollectionDetailPage = ({ shared = false }) => {
    const { id, uuid } = useParams();
    const navigate = useNavigate();
    const endpoint = shared ? `/api/collections/share/${uuid}` : `/api/collections/${id}`;
    const [result, setResult] = useState({ endpoint: null, collection: null, error: "" });
    const [removingId, setRemovingId] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [addQuery, setAddQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [addingId, setAddingId] = useState(null);
    const [addError, setAddError] = useState("");

    useEffect(() => {
        const controller = new AbortController();
        axios.get(endpoint, { signal: controller.signal })
            .then(({ data }) => {
                if (!data?.collection || !Array.isArray(data.collection.items)) {
                    throw new Error("The server returned an invalid collection response.");
                }
                setResult({ endpoint, collection: data.collection, error: "" });
            })
            .catch((requestError) => {
                if (!axios.isCancel(requestError)) {
                    setResult({
                        endpoint,
                        collection: null,
                        error: requestError.response?.data?.message || requestError.message || "Unable to load this collection.",
                    });
                }
            })

        return () => controller.abort();
    }, [endpoint]);

    useEffect(() => {
        const query = addQuery.trim();
        if (shared || !showAddForm || query.length < 2) {
            setSearchResults([]);
            setSearching(false);
            return undefined;
        }

        const controller = new AbortController();
        const timer = setTimeout(() => {
            setSearching(true);
            axios.get("/api/shows/search", {
                params: { q: query, limit: 8 },
                signal: controller.signal,
            })
                .then(({ data }) => setSearchResults(Array.isArray(data) ? data : []))
                .catch((requestError) => {
                    if (!axios.isCancel(requestError)) {
                        setAddError(requestError.response?.data?.message || "Unable to search titles.");
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
    }, [addQuery, shared, showAddForm]);

    const currentResult = result.endpoint === endpoint ? result : null;
    const collection = currentResult?.collection ?? null;
    const loading = currentResult === null;
    const error = currentResult?.error ?? "";

    const removeShow = async (showId) => {
        setRemovingId(showId);
        try {
            await axios.delete(`/api/collections/${id}/items/${showId}`);
            setResult((current) => current.endpoint !== endpoint || !current.collection
                ? current
                : {
                    ...current,
                    collection: {
                        ...current.collection,
                        items: current.collection.items.filter((item) => Number(item.id) !== Number(showId)),
                    },
                });
        } catch (requestError) {
            setResult((current) => current.endpoint === endpoint
                ? { ...current, error: requestError.response?.data?.message || "Unable to remove this show." }
                : current);
        } finally {
            setRemovingId(null);
        }
    };

    const addShow = async (show) => {
        setAddingId(show.id);
        setAddError("");
        try {
            await axios.post(`/api/collections/${id}/items`, { show_id: show.id });
            setResult((current) => current.endpoint !== endpoint || !current.collection
                ? current
                : {
                    ...current,
                    collection: {
                        ...current.collection,
                        items: [...current.collection.items, {
                            id: show.id,
                            name: show.title,
                            type: show.type,
                            photo_url: show.poster_url,
                        }],
                    },
                });
            setSearchResults((current) => current.filter((item) => item.id !== show.id));
        } catch (requestError) {
            setAddError(requestError.response?.data?.message || "Unable to add this title to the collection.");
        } finally {
            setAddingId(null);
        }
    };

    const items = collection?.items ?? [];

    return (
        <main className="min-h-screen px-4 pb-16 pt-8 text-white">
            <div className="mx-auto max-w-6xl">
                <Link to={shared ? "/" : "/collections"} className="inline-flex items-center gap-2 text-sm text-neutral-300 transition hover:text-white">
                    <ArrowLeft className="h-4 w-4" /> {shared ? "Home" : "My collections"}
                </Link>

                {loading ? (
                    <p className="py-20 text-center text-neutral-300">Loading collection...</p>
                ) : error && !collection ? (
                    <section role="alert" className="mt-8 rounded-2xl border border-red-400/20 bg-red-950/40 p-8 text-center">
                        <h1 className="text-2xl font-bold">Collection unavailable</h1>
                        <p className="mt-2 text-neutral-300">{error}</p>
                    </section>
                ) : (
                    <>
                        <header className="mt-6 rounded-2xl border border-white/10 bg-white/10 p-6 sm:p-8">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm uppercase tracking-[0.18em] text-blue-200">{shared ? "Shared collection" : "My collection"}</p>
                                    <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{collection.name}</h1>
                                    {collection.owner && <p className="mt-2 text-neutral-300">Created by {collection.owner}</p>}
                                </div>
                                <span className="inline-flex items-center gap-2 rounded-full bg-black/20 px-3 py-2 text-sm text-neutral-200">
                                    {collection.is_public ? <Globe className="h-4 w-4 text-green-300" /> : <Lock className="h-4 w-4" />}
                                    {collection.is_public ? "Public" : "Private"}
                                </span>
                            </div>
                            <div className="mt-5 flex flex-wrap items-center gap-4">
                                <p className="inline-flex items-center gap-2 text-sm text-neutral-300">
                                    <BookMarked className="h-4 w-4" /> {items.length} {items.length === 1 ? "movie" : "movies"}
                                </p>
                                {!shared && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAddForm((current) => !current);
                                            setAddError("");
                                        }}
                                        className="inline-flex items-center gap-2 rounded-lg border border-[#66568f] bg-[#1d1b2d] px-4 py-2 text-sm font-medium text-white transition hover:border-[#9596D6] hover:bg-[#302746]"
                                    >
                                        <Plus className="h-4 w-4" /> Add movies
                                    </button>
                                )}
                            </div>
                        </header>

                        {!shared && showAddForm && (
                            <section className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
                                <label htmlFor="collection-show-search" className="mb-2 block text-sm font-medium text-neutral-200">
                                    Search for a movie or show
                                </label>
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                                    <input
                                        id="collection-show-search"
                                        type="search"
                                        value={addQuery}
                                        onChange={(event) => {
                                            setAddQuery(event.target.value);
                                            setAddError("");
                                        }}
                                        placeholder="Type at least 2 characters..."
                                        className="w-full rounded-lg border border-white/10 bg-neutral-900 py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-blue-400"
                                    />
                                </div>
                                {addError && <p role="alert" className="mt-3 text-sm text-red-300">{addError}</p>}
                                {searching && (
                                    <p className="mt-3 flex items-center gap-2 text-sm text-neutral-400">
                                        <LoaderCircle className="h-4 w-4 animate-spin" /> Searching...
                                    </p>
                                )}
                                {!searching && addQuery.trim().length >= 2 && searchResults.length === 0 && !addError && (
                                    <p className="mt-3 text-sm text-neutral-400">No matching titles found.</p>
                                )}
                                <div className="mt-3 space-y-2">
                                    {searchResults.map((show) => {
                                        const alreadyAdded = items.some((item) => Number(item.id) === Number(show.id));
                                        return (
                                            <div key={show.id} className="flex items-center gap-3 rounded-lg bg-white/5 p-2">
                                                <div className="h-12 w-9 shrink-0 overflow-hidden rounded bg-neutral-800">
                                                    {show.poster_url && <img src={show.poster_url} alt="" className="h-full w-full object-cover" />}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium">{show.title}</p>
                                                    <p className="text-xs capitalize text-neutral-400">{show.type?.replaceAll("_", " ")}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => addShow(show)}
                                                    disabled={alreadyAdded || addingId === show.id}
                                                    className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-2 text-sm text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {addingId === show.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                                    {alreadyAdded ? "Added" : "Add"}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {error && <p role="alert" className="mt-4 rounded-lg bg-red-950/50 p-3 text-sm text-red-200">{error}</p>}

                        {items.length === 0 ? (
                            <section className="mt-6 rounded-2xl border border-white/10 bg-black/20 px-6 py-16 text-center">
                                <BookMarked className="mx-auto h-10 w-10 text-neutral-500" />
                                <h2 className="mt-4 text-xl font-semibold">No movies in this collection yet</h2>
                            </section>
                        ) : (
                            <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                                {items.map((show) => (
                                    <article key={show.id} className="overflow-hidden rounded-xl border border-white/10 bg-white/10">
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/shows/${show.id}`)}
                                            aria-label={`View reviews and details for ${show.name}`}
                                            className="block aspect-[2/3] w-full bg-neutral-800 text-left"
                                        >
                                            {show.photo_url ? (
                                                <img src={show.photo_url} alt={show.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="flex h-full items-center justify-center text-sm text-neutral-500">No poster</div>
                                            )}
                                        </button>
                                        <div className="p-3">
                                            <button type="button" onClick={() => navigate(`/shows/${show.id}`)} className="line-clamp-2 text-left font-semibold transition hover:text-[#EFAC61]">{show.name}</button>
                                            <p className="mt-1 text-sm capitalize text-neutral-400">{show.type?.replaceAll("_", " ")}</p>
                                            {!shared && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeShow(show.id)}
                                                    disabled={removingId === show.id}
                                                    className="mt-3 inline-flex items-center gap-2 text-sm text-neutral-400 transition hover:text-red-300 disabled:opacity-50"
                                                    aria-label={`Remove ${show.name} from collection`}
                                                >
                                                    <Trash2 className="h-4 w-4" /> Remove
                                                </button>
                                            )}
                                        </div>
                                    </article>
                                ))}
                            </section>
                        )}
                    </>
                )}
            </div>
        </main>
    );
};

export default CollectionDetailPage;
