import { useEffect, useState} from "react";
import axios from "axios";
import HeroUI from "../components/HomeComponents/HeroUI";
import ShowSlider from "../components/HomeComponents/ShowSlider";
import ShowTypeSelect from "../components/HomeComponents/ShowTypeBrowse";
import LoadingPlaceHolder from "../components/LoadingScreen";

function HomeContent(){
    const [featured, setFeatured] = useState([]);
    const [topRated, setTopRated] = useState([]);
    const [isLoading, setLoading] = useState(true);

    // to track api issue
    const [featuredError, setFeaturedError] = useState(false);
    const [topRatedError, setTopRatedError] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        const load = async() => {
            const [randoms, toprated] = await Promise.allSettled([
                // hero
                axios.get("/api/shows/randoms", {params: {
                    count: 15,
                    need_cover: 0
                }, signal: controller.signal }),
                // top rated
                axios.get("/api/shows/top-rated", {params: {
                    limit: 30
                }, signal: controller.signal})
            ]);

            if (controller.signal.aborted) return;
            setFeaturedError(randoms.status === "rejected");
            setTopRatedError(toprated.status === "rejected");
            if (randoms.status === "fulfilled") setFeatured(randoms.value.data);
            if (toprated.status === "fulfilled") setTopRated(toprated.value.data);

            setLoading(false);
            console.log(randoms);
            console.log("toprated")
            console.log(toprated);
        };

        load();
        return () => controller.abort();
    }, []);

    if (isLoading) {
        return (
            <LoadingPlaceHolder className="relative w-full h-screen bg-neutral-900"/>
        );
    }

    return (
        <>
            <main>
                <img src="https://puppiizsunniiz.github.io/Arknight-Images/characters/char_124_kroos_sale%2314_sp.png" alt="" aria-hidden="true"
                className="fixed -bottom-75 -left-64 z-0 w-4xl md:w-5xl pointer-events-none select-none opacity-10" />
                <HeroUI shows={featured} loading = {isLoading} error={featuredError} />
                <div className="bg-linear-to-b from-neutral-900 to-neutral-950">
                    <ShowSlider 
                        title="Top Rated"
                        subtitle="Ranked by reviewed scores"
                        shows={topRated}
                        loading={isLoading}
                        error={topRatedError}
                    />
                    <ShowTypeSelect />
                </div>
            </main>
        </>
    )
}

export default HomeContent