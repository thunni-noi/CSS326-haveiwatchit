import { useEffect, useState} from "react";
import axios from "axios";
import HeroUI from "../HomeComponents/HeroUI";
import ShowSlider from "../HomeComponents/ShowSlider";
import ShowTypeSelect from "../HomeComponents/ShowTypeBrowse";
import LoadingPlaceHolder from "../LoadingScreen";

function HomeContent(){
    const [featured, setFeatured] = useState([]);
    const [topRated, setTopRated] = useState([]);
    const [loading, setLoading] = useState(true);

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
                    limit: 10
                }, signal: controller.signal})
            ]);

            if (controller.signal.aborted) return;
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

    if (loading) {
        return (
            <LoadingPlaceHolder className="relative w-full h-screen bg-neutral-900"/>
        );
    }

    return (
        <>
            <img src="https://puppiizsunniiz.github.io/Arknight-Images/characters/char_124_kroos_sale%2314_sp.png" alt="" aria-hidden="true"
            className="fixed -bottom-75 -left-64 z-0 w-4xl md:w-5xl pointer-events-none select-none opacity-10" />
            <HeroUI shows={featured} loading = {loading} />
            <div className="bg-linear-to-b from-neutral-900 to-neutral-950">
                <ShowSlider 
                    title="Top Rated"
                    subtitle="Ranked by reviewed scores"
                    shows={topRated}
                    loading={loading}
                />
                <ShowTypeSelect />
            </div>
        </>
    )
}

export default HomeContent