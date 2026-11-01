import { useRef } from "react";
import { ChevronLeft as LeftArrow, ChevronRight as RightArrow } from "lucide-react";
import ShowCard from "./ShowCard"
import LoadingPlaceHolder from "../LoadingScreen";
import ErrorDisplay from "../ErrorDisplay";

function ShowSlider({shows =[], loading = false, error = false}) {

    const scrollRef = useRef(null);

    const scroll = (direction) => {
        const scroller = scrollRef.current;
        if (!scroller) return;
        scroller.scrollBy({ left: direction * scroller.clientWidth * 0.8, behavior: "smooth"});
    }



    return(
        <section className="py-12 relative z-10" id="Top_Rated">
            <div className="container mx-auto px-4">
                <div className="flex items-baseline justify-between mb-8">
                    <div className="text-2xl md:text-3xl font-bold text-white">
                        <h2>Top Rated</h2>
                        <span className="text-neutral-400 text-sm mt-1">
                            Ranked by reviews score
                            <span className="text-neutral-500 text-xs px-1">
                                (Score shown is normalize using Bayesian's Sum and will differ from average!)
                            </span>
                        </span>
                    </div>
                    <div className="flex space-x-2">
                        <button className="p-2 rounded-full bg-neutral-800/70 hover:bg-neutral-700 text-white transition-all" aria-label="Scroll left"
                                onClick={() => scroll(-1)}>
                        <LeftArrow />
                        </button>
                        <button className="p-2 rounded-full bg-neutral-800/70 hover:bg-neutral-700 text-white transition-all" aria-label="Scroll Right"
                                onClick={() => scroll(1)}>
                        <RightArrow />
                        </button>
                    </div>
                </div>
                {/* Slider */}
                <div className="relative">
                    <div ref={scrollRef} className="flex space-x-4 overflow-x-hidden pb-4 snap-x">
                        {loading && <LoadingPlaceHolder />}
                        {!loading && error && (<ErrorDisplay text="Couln't fetch top-rated shows. Please try again later" className="w-full h-64"/>)}
                        {!loading && !error && shows.map((show) => (
                            <ShowCard key={show.id} show={show} className="w-50 md:w-60 shrink-0 snap-start"/>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default ShowSlider