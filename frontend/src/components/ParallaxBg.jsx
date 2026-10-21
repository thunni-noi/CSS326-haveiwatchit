import { useEffect, useRef } from "react";

const IMAGE_URL =
    "https://puppiizsunniiz.github.io/Arknight-Images/characters/char_124_kroos_sale%2314_sp.png";

const ParallaxBackground = () => {
    const gradientRef = useRef(null);
    const imageRef = useRef(null);

    useEffect(() => {
        let ticking = false;

        const update = () => {
            const y = window.scrollY;
            // different factors = parallax between layers
            if (gradientRef.current)
                gradientRef.current.style.transform = `translate3d(0, ${y * 0.1}px, 0)`;
            if (imageRef.current)
                imageRef.current.style.transform = `translate3d(0, ${y * 0.35}px, 0)`;
            ticking = false;
        };

        const onScroll = () => {
            if (!ticking) {
                requestAnimationFrame(update);
                ticking = true;
            }
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);


    return (
        <div className="fixed inset-0 -z-10 overflow-hidden bg-black">
            {/* back layer: gradient (oversized so it never reveals edges while moving) */}
            <div
                ref={gradientRef}
                className="absolute -inset-y-40 inset-x-0 bg-linear-to-br from-slate-950 via-indigo-900 to-amber-900/40 will-change-transform"
            />

            {/* front layer: image with opacity */}
            <img
                ref={imageRef}
                src={IMAGE_URL}
                alt=""
                className="absolute -left-75 top-50 h-[120vh] w-auto max-w-none opacity-75 will-change-transform select-none pointer-events-none"
            />
        </div>
    );
};

export default ParallaxBackground;