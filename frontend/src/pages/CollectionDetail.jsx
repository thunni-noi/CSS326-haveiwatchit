import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BookMarked, Globe, Lock, Trash2 } from "lucide-react";

const CollectionDetailPage = ({ shared = false }) => {
    const { id, uuid } = useParams();
    const endpoint = shared ? `/api/collections/share/${uuid}` : `/api/collections/${id}`;
    const [result, setResult] = useState({ endpoint: null, collection: null, error: "" });
    const [removingId, setRemovingId] = useState(null);

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
                            <p className="mt-5 inline-flex items-center gap-2 text-sm text-neutral-300">
                                <BookMarked className="h-4 w-4" /> {items.length} {items.length === 1 ? "show" : "shows"}
                            </p>
                        </header>

                        {error && <p role="alert" className="mt-4 rounded-lg bg-red-950/50 p-3 text-sm text-red-200">{error}</p>}

                        {items.length === 0 ? (
                            <section className="mt-6 rounded-2xl border border-white/10 bg-black/20 px-6 py-16 text-center">
                                <BookMarked className="mx-auto h-10 w-10 text-neutral-500" />
                                <h2 className="mt-4 text-xl font-semibold">No shows in this collection yet</h2>
                            </section>
                        ) : (
                            <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                                {items.map((show) => (
                                    <article key={show.id} className="overflow-hidden rounded-xl border border-white/10 bg-white/10">
                                        <div className="aspect-[2/3] bg-neutral-800">
                                            {show.photo_url ? (
                                                <img src={show.photo_url} alt={show.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="flex h-full items-center justify-center text-sm text-neutral-500">No poster</div>
                                            )}
                                        </div>
                                        <div className="p-3">
                                            <h2 className="line-clamp-2 font-semibold">{show.name}</h2>
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
