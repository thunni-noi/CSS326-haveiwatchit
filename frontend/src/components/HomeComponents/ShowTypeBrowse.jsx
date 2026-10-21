import React, { useEffect, useState, useRef } from "react";
import axios from "axios"
import { Star as StarIcon } from "lucide-react";
import LoadingPlaceHolder from "../LoadingScreen";
import ErrorDisplay from "../ErrorDisplay";
import ShowCard from "./ShowCard";

const SHOW_TYPES = [
    { value: "movie", title: "Movies" },
    { value: "series", title: "Series" },
    { value: "anime", title: "Anime"}
]

function ShowTypeSelect() {

    const pageSize = 12; // 4 x 3

    const [currentType, setCurrentType] = useState(SHOW_TYPES[0].value);
    const [showList, setShowList] = useState([]);
    const[hasMore, setHasMore] = useState(false);
    const[isLoading, setLoading] = useState(true);
    const[isLoadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(false);
    const [loadMoreError, setLoadMoreError] = useState(false);

    const currentTypeRef = useRef(currentType);
    currentTypeRef.current = currentType;

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError(false);
        setShowList([]);
        setHasMore(false);

        axios.get("api/shows/by-type", {
            params: {type: currentType, limit: pageSize, offset: 0},
            signal: controller.signal
        }).then((res) => {
            setShowList(res.data.shows);
            setHasMore(res.data.still_more);
        })
        .catch((err) => {
            if(!axios.isCancel(err)) setError(true);
        })
        .finally(() => {
            console.log(showList, currentType);
            if (!controller.signal.aborted) setLoading(false);
        });
        
        return () => controller.abort();

    }, [currentType]);

    // if there's still more to load
    const fetchMore = async () => {
        if (isLoadingMore || !hasMore) return;
        const requestType = currentType;
        setLoadingMore(true);
        setLoadMoreError(false);
        try {
            const res = await axios.get("api/shows/by-type", {
                params: {type: requestType, limit: pageSize, offset: showList.length },
            });
            // while fetching, user switch
            if (requestType !== currentTypeRef.current) return;

            // add only news shows
            setShowList((prev) => {
                const oldId = new Set(prev.map((o) => o.id));
                return [...prev, ...res.data.shows.filter((s) => !oldId.has(s.id))]
            });
            setHasMore(res.data.still_more);
        } catch {
            if (requestType === currentTypeRef.current) setLoadMoreError(true);
        } finally {
            setLoadingMore(false);
        }
    }

    return(
        <section className="py-12 bg-neutral-900/50 relative z-10" id="">
            <div className="container mx-auto px-4">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Browse by Type</h2>

                {/* Type */}
                <div className="mb-8 overflow-x-auto pb-2">
                    <div className="flex space-x-2 min-w-max">
                        {/* Mapper */}
                        {
                            SHOW_TYPES.map((t) =>(
                                <button key={t.value} type="button" onClick={() => setCurrentType(t.value)} aria-pressed={currentType === t.value}
                                className={`px-4 py-2 rounded-md transition-colors text-sm 
                                    ${currentType === t.value ? 
                                        "bg-[#9596D6] text-white" : 
                                        "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"}`}>
                                {t.title}
                                </button>
                        ))}
                    </div>
                </div>

                {isLoading && (
                    <div style={{minHeight: 1200}}>
                    <LoadingPlaceHolder className="h-64" />
                    </div>
                )}

                {!isLoading && error && (
                    <ErrorDisplay text="Couldn't load shows. Please try again later." className="h-64"/>
                )}

                {!isLoading && !error && showList.length === 0 && (
                    <ErrorDisplay text="No show founds" className="h-64"/>
                )}

                {!isLoading && showList.length > 0 && (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                            {
                                showList.map((show) => (
                                    <ShowCard key={show.id} show={show}/>
                                ))}
                        </div>
                        {/* Load more */}
                        <div className="mt-10 flex flex-col items-center gap-3">
                            { loadMoreError && (<ErrorDisplay
                                text={"Could not fetch more, Please try again later"}
                                className="relative w-full h-48 bg-neutral-900"
                            />)}
                            {hasMore ? (
                                <button type="button" onClick={fetchMore} disabled={isLoadingMore}
                                className="bg-neutral-800/80 hover:bg-neutral-700/80 disabled:opacity-60 disabled:cursor-not-allowed
                                text-white px-8 py-3 rounded-lg border border-neutral-600 transition-all text-sm">
                                    {isLoadingMore ? "Loading..." : "Browse more"}
                                </button>
                            ) : (
                                <p className="text-neutral-500 text-sm">End</p>
                            )}
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}

export default ShowTypeSelect;