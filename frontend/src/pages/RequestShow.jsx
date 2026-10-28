import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

const RequestPage = ({ user }) => {

    const [error, setError] = useState("");
    const [posting, setPosting] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const title = document.getElementById("title_text").value.trim();
        const type = document.getElementById("type_select").value.trim();
        const content_rating = document.getElementById("content_rating_text").value.trim();
        const synopsis = document.getElementById("synopsis_text").value.trim();
        const details = document.getElementById("details_text").value.trim();
        if (title === "") return;
        setPosting(true);

        axios.post("/api/shows/submission", {
            title: title,
            type: type,
            content_rating: content_rating,
            synopsis: synopsis,
            details: details
        })
        .catch((err) => {
            setError("Could not save submission.")}
        )
        .finally(() => setPosting(false)) 


    };

    if (!user){
        return  (
            <main className="container mx-auto px-4 py-6">
                <div className="relative flex justify-center items-center mx-auto max-w-5xl min-h-screen sm:px-8 bg-neutral-900/80 backdrop-blur-lg text-white">
                    <section className="rounded-xl border border-white/10 bg-neutral-900/80 p-8 text-center ju">
                        <h2 className="text-xl font-semibold">You need to sign in to submit request</h2>
                        <p className="mt-2 text-sm text-neutral-400">As wise man once said, 401: Who are you? - Tsun Tzu</p>
                        <Link to="/login" className="mt-5 inline-flex rounded-lg bg-[#3336cc] px-5 py-2.5 font-semibold text-white transition hover:bg-blue-900">
                            Sign in
                        </Link>
                    </section>
                </div>
            </main>
        )
    }

    if (user.is_suspended){
        return  (
            <main className="container mx-auto px-4 py-6">
                <div className="relative flex justify-center items-center mx-auto max-w-5xl min-h-screen sm:px-8 bg-neutral-900/80 backdrop-blur-lg text-white">
                    <section className="rounded-xl border border-white/10 bg-neutral-900/80 p-8 text-center ju">
                        <h2 className="text-xl font-semibold text-red-400">YOU ARE CURRENTLY SUSPENDED</h2>
                        <p className="mt-2 text-sm text-neutral-400">You cannot submit any request while suspended <br/> If you believe this is a mistake, please contact admin for appeal</p>
                    </section>
                </div>
            </main>
        )
    }


    return (
        <main className="container mx-auto px-4 py-6">
            <div className="flex py-24 mx-auto min-h-screen items-center justify-center bg-black/50 backdrop-blur-lg text-white">
                <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-3 rounded-md border border-neutral-700 bg-neutral-800/60 p-4">
                    <h3 className="text-lg font-semibold text-white">
                        Request new shows to be added
                    </h3>

                    <div className="flex flex-col justify justify-left gap-y-1">
                        <div className="flex flex-col justfiy justify-left">
                            <span className="text-white inline-block">Title<span className="text-red-400 text-xs"> (required) </span></span>
                            <input type="text" id="title_text" placeholder="What's the name (max 100 characters)" maxLength={100}
                            className="field-sizing-fixed text-sm w-full h-10 bg-neutral-900 text-white px-3 py-3 mb-3">
                            </input>
                        </div>
                        <div className="flex flex-row items-center gap-6">
                            <div className="flex flex-row items-center gap-1 w-1/3">
                                <span className="text-white inline-block text-md">Type:</span>
                                <select id="type_select" className="appearance-none bg-neutral-neutral-950 ml-2 px-2 bg-neutral-secondary-medium placeholder:text-slate-400 text-white text-center border border-white/50 rounded-md cursor-pointer">
                                    <option value="movie" className="bg-neutral-800">Movie</option>
                                    <option value="series" className="bg-neutral-800">Series</option>
                                    <option value="anime" className="bg-neutral-800">Anime</option>
                                </select>
                            </div>
                            <div className="flex flex-row items-center gap-2 w-1/2">
                                <span className="text-white inline-block">Content Rating: </span>
                                <input type="text" id="content_rating_text" placeholder="e.g. PG-13" maxLength={10}
                                className="text-sm h-8 bg-neutral-900 mt-2  text-white px-3 mb-3">
                            </input>
                            </div>
                        </div>

                        <span className="text-white inline-block">Synopsis</span>
                        <textarea id="synopsis_text" placeholder="What is the story about..? (max 1000 characters)" maxLength={1000}
                        className="field-sizing-fixed text-sm w-full h-30 bg-neutral-900 text-white px-3 py-3 mb-3">
                        </textarea>

                        <span className="text-white inline-block">Other details</span>
                        <textarea id="details_text" placeholder="Where to watch, Promotional videos etc... (max 1000 characters)" maxLength={1000}
                        className="field-sizing-fixed text-sm w-full h-30 bg-neutral-900 text-white px-3 py-3 mb-3">
                        </textarea>

                        <div className="flex flex-row gap-2 justify-end">
                            <button type="submit"
                            className="text-white bg-blue-500  rounded-md py-1 w-40 hover:bg-blue-800">
                                {posting? "Submitting..." : "Submit"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </main>
    );
};

export default RequestPage;