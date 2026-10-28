import axios from "axios";
import { useEffect, useState } from "react";
import LoadingPlaceHolder from "../components/LoadingScreen";
import { Link, useParams } from "react-router-dom";
import PlaceholderCover from "../assets/placeholder_image.jpg"
import RoleCard from "../components/DetailComponents/RoleCard";
import { BookMarked, Check, Globe, Lock, LoaderCircle, Plus, X, 
    Scroll as WantIcon, Eye as WatchIcon,  CircleCheck as CompletedIcon,
    Repeat2 as RewatchIcon, Loader as OnHoldIcon, CircleOff as DropIcon
 } from "lucide-react";
import ReviewSection from "../components/DetailComponents/ReviewSection";
import AddWatchlistModal from "../components/AddWatchlistModal";
import ErrorDisplay from "../components/ErrorDisplay";
import AddCollectionModal from "../components/AddCollectionModal";



const watchStatusLabel = {
    "wishlist"  : {label: "Want to watch", icon: WantIcon} ,
    "watching"  : "Watching" ,
    "watched"   : "Completed" ,
    "rewatching": "Rewatching" ,
    "on_hold"   : "On hold" ,
    "dropped"   : "Dropped" ,
};

function watchlistButton(status) {
    console.log(status)
    switch(status){
        case 'wishlist':
            return <> <WantIcon className="h-4 w-4" /> Want To Watch</>;
        case 'watching':
            return <> <WatchIcon className="h-4 w-4" /> Watching</>;
        case 'watched':
            return <> <CompletedIcon className="h-4 w-4" /> Completed</>;
        case 'rewatching':
            return <> <RewatchIcon className="h-4 w-4" /> Re-watching</>;
        case 'on_hold':
            return <> <OnHoldIcon className="h-4 w-4" /> On Hold</>;
        case 'dropped':
            return <> <DropIcon className="h-4 w-4" /> Dropped</>;
        default:
            return <> <Plus className="h-4 w-4" /> Add To Watchlist</>
    }
}

function captitalizeText(text){
    if(!text || typeof text !== "string")  return "N/A";
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatDate(dateVal){
    if (!dateVal) return "N/A";
    return new Date(dateVal).toLocaleDateString("en-US", {year: "numeric", month: "short", "day": "numeric"});
}

function formatDuration( duration, episodeCount ){
    if (!duration) return "N/A";
    return episodeCount > 1 ? `${duration} minute per ep. (Total ${duration * episodeCount} minutes)` : `${duration} minutes`;
}

const fetchWatchStatus = async (showId, signal) => {
    try{ 
        const res = await axios.get(`/api/watchlist/${showId}`, {signal: signal})
        return res.data;
    } catch (err) {
        if (err.response?.status === 404) return null;
        throw err
    }
}

function ShowDetails( {user} ) {

    const { showId } = useParams();
    const [showInfo, setShowInfo ] = useState({});
    const [isLoading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const [openWatchlist, setOpenWatchlist] = useState(null);
    const [watchlistStatus, setWatchlistStatus] = useState(null);
    const [openCollection, setOpenCollection] = useState(false);

    const refreshPage = () => setRefresh((refresh) => !refresh);

    useEffect(() => {
        const controller = new AbortController();

        Promise.all([
            axios.get(`/api/shows/${showId}`, {signal: controller.signal}),
            user ? fetchWatchStatus(showId, controller.signal) : Promise.resolve(null)
        ])
        .then(([showInfo, watchStatus]) => {
            console.log(showInfo);
            setShowInfo(showInfo.data);
            setWatchlistStatus(watchStatus? watchStatus[0] : null);
        })
        .catch((err) => {
            if (!axios.isCancel(err)) setError(true);
        })
        .finally(() => {
            if (!controller.signal.aborted) setLoading(false);
        })

        return () => {
            controller.abort();
        };
    }, [showId, refresh]);

    const updateWatchStatus = async (watchStatus)  => {
        axios.patch(`/api/watchlist/${showId}`, {status: watchStatus})
        .then((res) => {
            setWatchlistStatus({status: watchStatus});
            return(res.data)
        })
        .catch((err) => {throw err})
    }

    if (isLoading) {
        return (
            <LoadingPlaceHolder className="relative w-full h-screen bg-neutral-900"/>
        );
    }

    if (error) {
        return (
            <main className="container mx-auto flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center text-white">
                {/* <p className="text-xl font-semibold">Unable to load this title.</p>
                <Link to="/" className="font-medium text-[#EFAC61] hover:underline">Return home</Link> */}
                <ErrorDisplay text="Unable to load shows info" />
            </main>
        );
    }

    return (
        <>
        <main className="container mx-auto px-4 py-6">
            <div className="pt-24 px-2 bg-neutral-900/95">
                <div className="overflow-hidden w-full h-full rounded-lg ">
                    <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                        <div>
                            <p className="text-xd text-neutral-500 mb-1">{showInfo.type.toUpperCase() ?? showInfo.title}</p>
                            <h1 className="text-2xl md:text-3xl font-bold text-white">{showInfo.title}</h1>
                        </div>
                    </header>

                    <div className="grid gap-6 p-5 md:grid-cols-[14rem_1fr]">
                        {/* Sidebar */}
                        <aside className="space-y-6 ">
                            <div className="space-y-2">
                                <img src={showInfo.poster_url ?? PlaceholderCover} alt={showInfo.title} loading="lazy"
                                className="object-cover w-full aspect-2/3"/>
                                <button type="button"
                                onClick={() => setOpenWatchlist(showInfo)}
                                className="flex w-full items-center justify-center gap-2 rounded-md bg-[#303969] py-2 text-sm font-semibold text-white transition-all hover:bg-[#414b82]">
                                {watchlistButton(watchlistStatus?.status)}
                                </button>
                                <button type="button"
                                onClick={() => setOpenCollection(true)}
                                className="flex w-full items-center justify-center gap-2 rounded-md bg-[#303969] py-2 text-sm font-semibold text-white transition-all hover:bg-[#414b82]">
                                <Plus className="h-4 w-4" /> Add to Collection
                                </button>
                            </div>

                            <section>
                                <div className="flex items-end justify-between border-b border-neutral-700 pb-1 mb-3 text-white">
                                    Informations
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-sm text-neutral-300">
                                        <span className="text-neutral-500">Type: </span>
                                        {captitalizeText(showInfo.type)}
                                    </p>
                                    <p className="text-sm text-neutral-300">
                                        <span className="text-neutral-500">Episodes: </span>
                                        {showInfo.episode_count?? "N/A"}
                                    </p>
                                    <p className="text-sm text-neutral-300">
                                        <span className="text-neutral-500">Status: </span>
                                        {captitalizeText(showInfo.status)}
                                    </p>
                                    <p className="text-sm text-neutral-300">
                                        <span className="text-neutral-500">Released: </span>
                                        {formatDate(showInfo.release_date)}
                                    </p>
                                    <p className="text-sm text-neutral-300">
                                        <span className="text-neutral-500">Duration: </span>
                                        {formatDuration(showInfo.duration, showInfo.episode_count)}
                                    </p>
                                </div>
                            </section>

                            <section>
                                <div className="flex items-end justify-between border-b border-neutral-700 pb-1 mb-3 text-white">
                                    Available On
                                </div>
                                {showInfo.platforms.length > 0 ? 
                                    (
                                        <ul className="space-y-2">
                                            {showInfo.platforms.map((p) => (
                                                <li key={p.id}>
                                                    <a href={p.url} target="_blank" rel="noreferred"
                                                    className="flex items-center gap-2 text-sm text-neutral-300">
                                                        <img src={p.logo_url ?? PlaceholderCover} alt={showInfo.title} loading="lazy"
                                                        className="object-cover size-6"/>
                                                        <span className={`flex-1 truncate ${p.url ? "underline" : ""}`}>{p.name}</span>
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-neural-500">Not listed in database yet!</p>
                                    )}
                            </section>
                        </aside>
                        {/* Main */}
                        <div className="min-w-0 space-y-8">
                            <section className="relative overflow-hidden min-h-100 flex flex-wrap items-center gap-x-8 gap-y-3 rounded-md bg-neutral-800 p-4">
                            {showInfo.backdrop_url && (
                                <div className="absolute inset-y-0 right-0 w-3/4 overflow-hidden">
                                    <img src={showInfo.backdrop_url} className="h-full w-full object-cover object-center" />
                                    <div className="absolute inset-0 bg-linear-to-r from-neutral-800 from-10% to-transparent to-75%" />

                                </div>
                            )}
                                <div className="relative w-1/3 flex flex-wrap items-center justify-left gap-x-10 gap-y-5">
                                    <div className="relative z-10 flex flex-col items-center justify-between">
                                        <p className="text-m font-semibold text-white bg-[#EFAC61] px-3 py-1">SCORE</p>
                                        <p className="flex item-center gap-1 text-3xl pt-1 font-bold text-white">{showInfo.avg_score ?? "N/A"}</p>
                                        <p className="text-m text-white">{showInfo.review_count} reviews</p>
                                    </div>
                                    <div className="relative z-10 flex flex-col items-center">
                                        <p className="text-m font-semibold text-white bg-[#303969] px-3 py-1">RATING</p>
                                        <p className="flex item-center gap-1 text-3xl pt-1 font-bold text-white mb-6">{showInfo.content_rating ?? "N/A"}</p>
                                    </div>
                                </div>
                            </section>
                                <div className="flex items-end justify-between border-b border-neutral-700 pb-1 mb-3 text-white">
                                    Synopsis
                                </div>
                                <p className="max-w-3xl text-sm leading-relaxed text-neutral-300">
                                    {showInfo.synopsis ?? "No synopsis found for this shows!"}
                                </p>

                            <section>
                                <div className="flex items-end justify-between border-b border-neutral-700 pb-1 mb-3 text-white">
                                    Casts
                                </div>
                                <div className="space-y-5">
                                    {showInfo.cast.length > 0 && (
                                        <div className="grid gap-2 lg:grid-cols-2">
                                            {showInfo.cast.map((c) => <RoleCard key={c.role_id} role={c}/>)}
                                        </div>
                                    )}
                                </div>
                            </section>

                            <section>
                                <div className="flex items-end justify-between border-b border-neutral-700 pb-1 mb-3 text-white">
                                    Crews
                                </div>
                                <div className="space-y-5">
                                    {showInfo.crew.length > 0 && (
                                        <div className="grid gap-2 lg:grid-cols-2">
                                            {showInfo.crew.map((c) => <RoleCard key={c.role_id} role={c}/>)}
                                        </div>
                                    )}
                                </div>
                            </section>
                                <div className="flex items-end justify-between border-b border-neutral-700 pb-1 mb-3 text-white">
                                    Reviews
                                </div>
                                <ReviewSection showId={showId} user={user} onUpdated={refreshPage} />
                            <section>

                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </main>
        {openCollection && <AddCollectionModal showInfo={showInfo} user={user} onClose={() => setOpenCollection(false)}/>}
        {openWatchlist && <AddWatchlistModal user={user} show={showInfo} initialStatus={watchlistStatus?.status} onSubmit={updateWatchStatus} onClose={() => setOpenWatchlist(false)}/>}
        </>
    )
}

export default ShowDetails;
