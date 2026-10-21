import { useNavigate } from "react-router-dom";
import { Star as StarIcon } from "lucide-react";
import PlaceholderCover from "../../assets/placeholder_image.jpg";

function ShowCard({ show, className="" }){
    
    const navigate = useNavigate();
    let score = show.weighted_score ?? show.avg_score
    score = typeof score === "number" ? score.toFixed(2) : "N/A";

    return (
        <div role="link" onClick={() => navigate(`/shows/${show.id}`)}
        className={`relative group cursor-pointer ${className}`} >
            <div className="rounded-lg overflow-hidden bg-neutral-800">
                <div className="relative aspect-2/3">
                    <img src={show.poster_url ?? PlaceholderCover} alt={show.title} loading="lazy"
                    className="w-full h-full object-cover transition-all group-hover:scale-110 group-hover:opacity-35" />
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-linear-to-t from-neutral-900/90 via-neutral-900/50 to-transparent flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                            <div className="flex items-center justify-between">
                                <span className="text-neutral-400 text-sm font-medium">{ typeof show.type === "string" ? show.type.toUpperCase() : "N/A"}</span>
                                <span className="text-neutral-400 text-sm">RATED {show.content_rating ?? "N/A"}</span>
                            </div>
                            <button type="button" className="w-full bg-[#EFAC61] hover:bg-[#c27f33] text-white mt-2 py-3 rounded-md flex items-center justify-center gap-1 text-sm transition-all">
                                Details
                            </button>
                        </div>
                    </div>
                </div>    
            </div>  

            <div className="mt-3">
                <h3 className="text-white text-sm font-medium truncate">{show.title}</h3>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                        <StarIcon color="#ffe234" fill="#ffe234" className="size-4" />
                        <span className="text-yellow-400 text-xs font-medium">{score}</span>
                    </div>
                    <span className="text-neutral-500 text-xs">{show.release_year ?? ""}</span>
                </div>
            </div>
        </div>
    )
}

export default ShowCard;