import { useEffect, useMemo, useState } from "react";
import JsonView from 'react18-json-view'
import 'react18-json-view/src/style.css'
import "react18-json-view/src/dark.css"
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import SuccessDisplay from "../components/SuccessDisplay";
import LoadingPlaceHolder from "../components/LoadingScreen";
import ErrorDisplay from "../components/ErrorDisplay";

const testList = [
    {label: "Access Control - ", url: "/api/"}

]


function TestCasePage ({ user }) {

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [result, setResult] = useState({});

    
    const navigate = useNavigate();

    const request_07 = async (score, text) => {
        console.log("pressed")
        setSuccess("");
        setResult({});
        setError("")
        axios.post("/api/shows/2/reviews", {
            score: score,
            text: text
        })
        .then((res) => {
            setSuccess("Success")
            setResult(res);
        })
        .catch((err) => {
            setError("Failed")
            console.log(typeof(err.response))
            setResult(err.response);
        })
    }

    const query_07 = async() => {
        setSuccess("");
        setResult({});
        setError("")
        axios.get("/api/shows/2/reviews")
        .then((res) => {
            setSuccess("Success")
            setResult(res);
        })
        .catch((err) => {
            setError("Failed")
            console.log(typeof(err.response))
            setResult(err.response);
        })
    }

    const delete_08 = async() => {
        setSuccess("");
        setResult({});
        setError("")
        axios.delete(`/api/shows/2/reviews/5`)
        .then((res) => {
            setSuccess("Success")
            setResult(res);
        })
        .catch((err) => {
            setError("Failed")
            console.log(typeof(err.response))
            setResult(err.response);
        })
    }

    const query_14 = async() => {
        setSuccess("");
        setResult({});
        setError("")
        axios.get(`/api/shows/2`)
        .then((res) => {
            setSuccess("Success")
            setResult(res);
        })
        .catch((err) => {
            setError("Failed")
            console.log(typeof(err.response))
            setResult(err.response);
        })
    }

    return (
        <main className="container mx-auto px-4 py-6">
            <div className="py-24 mx-auto min-h-screen bg-black/50 backdrop-blur-lg text-white">
                <section className= "border-b border-white/10">
                    <div className="mx-auto max-w-5xl px-5 py-9 sm:px-8">
                        <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">Additional Test Cases</h1>
                        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-neutral-300">
                            {/* <span>Contains {items.length} {items.length === 1 ? "title" : "titles"}</span>
                            <span>You've watched {watchedPercent}%</span> */}
                        </div>
                    </div>
                </section>

                <div className="flex min-w-9/10 min-h-100 mx-5 my-5 items-center justify-center border border-dashed border-neutral-200">
                    {loading && !success && !error && <LoadingPlaceHolder />}
                    {!loading && !!success && !error && <SuccessDisplay text={success} />}
                    {!loading && !success && !!error && <ErrorDisplay text={error} />}
                    {!loading && !success && !error && "Status Display Here"}
                </div>

                {Object.keys(result).length > 0 && 
                    <div className="flex min-w-9/10 flex-col mx-5 my-5 px-5 py-5  border border-dashed border-neutral-200">
                        JSON DISPLAY
                        <JsonView src={result} dark={true} theme="atom" className="px-2 py-2" />
                    </div>
                }

                <div className="mx-auto max-w-5xl sm:px-8">
                    
                </div>

                <div className="flex flex-col gap-y-2">
                    <div className="flex flex-col mx-5 my-5 bg-neutral-700">
                        <span className="text-2xl font-bold px-2 pt-2"> [07 VALIDATE] (LOGGED IN) - FAILED</span>
                        <span className="text-sm font-light px-2 pb-2">POST /api/shows/2/reviews</span>
                        <div className="flex flex-row bg-neutral-900 px-2 py-2 justify-between">
                            <div className="flex flex-col justify-start items-start">  
                                Body
                                <JsonView src={{score: 99, text:"Very cool"}} dark={true} theme="atom" />
                            </div>
                            <button onClick={() => request_07(99, "Very cool")}
                            className="mr-5 bg-blue-700 px-3 py-3 self-center hover:bg-blue-800 transition-all">
                                Send Request
                            </button>
                        </div>   
                    </div>

                    <div className="flex flex-col mx-5 my-5 bg-neutral-700">
                        <span className="text-2xl font-bold px-2 pt-2"> [07 VALIDATE] - FAILED</span>
                        <span className="text-sm font-light px-2 pb-2">POST /api/shows/2/reviews</span>
                        <div className="flex flex-row bg-neutral-900 px-2 py-2 justify-between">
                            <div className="flex flex-col justify-start items-start">  
                                Body
                                <JsonView src={{score: 10, text:""}} dark={true} theme="atom" />
                            </div>
                            <button onClick={() => request_07(10, "")}
                            className="mr-5 bg-blue-700 px-3 py-3 self-center hover:bg-blue-800 transition-all">
                                Send Request
                            </button>
                        </div>   
                    </div>

                    <div className="flex flex-col mx-5 my-5 bg-neutral-700">
                        <span className="text-2xl font-bold px-2 pt-2"> [07 VALIDATE] - SUCCESS</span>
                        <span className="text-sm font-light px-2 pb-2">POST /api/shows/2/reviews</span>
                        <div className="flex flex-row bg-neutral-900 px-2 py-2 justify-between">
                            <div className="flex flex-col justify-start items-start">  
                                Body
                                <JsonView src={{score: 10, text:"Very Cool"}} dark={true} theme="atom" />
                            </div>
                            <button onClick={() => request_07(10, "Very cool")}
                            className="mr-5 bg-blue-700 px-3 py-3 self-center hover:bg-blue-800 transition-all">
                                Send Request
                            </button>
                        </div>   
                    </div>

                    <div className="flex flex-col mx-5 my-5 bg-neutral-700">
                        <span className="text-2xl font-bold px-2 pt-2"> [07 VALIDATE] - CHECK REVIEW</span>
                        <span className="text-sm font-light px-2 pb-2">GET /api/shows/2/reviews</span>
                        <div className="flex flex-row bg-neutral-900 px-2 py-2 justify-between">
                            <div className="flex justify-center items-center">  
                                No Body
                            </div>
                            <button onClick={query_07}
                            className="mr-5 bg-blue-700 px-3 py-3 self-center hover:bg-blue-800 transition-all">
                                Send Request
                            </button>
                        </div>   
                    </div>

                    <div className="flex flex-col mx-5 my-5 bg-neutral-700">
                        <span className="text-2xl font-bold px-2 pt-2"> [08 NON-AUTHORIZED DELETION] (LOGOUT FIRST) </span>
                        <span className="text-sm font-light px-2 pb-2">DELETE /api/shows/2/reviews/5</span>
                        <div className="flex flex-row bg-neutral-900 px-2 py-2 justify-between">
                            <div className="flex justify-center items-center">  
                                No Body
                            </div>
                            <button onClick={delete_08}
                            className="mr-5 bg-blue-700 px-3 py-3 self-center hover:bg-blue-800 transition-all">
                                Send Request
                            </button>
                        </div>   
                    </div>

                    <div className="flex flex-col mx-5 my-5 bg-neutral-700">
                        <span className="text-2xl font-bold px-2 pt-2"> [14 TRIGGER]</span>
                        <span className="text-sm font-light px-2 pb-2">GET /api/shows/2</span>
                        <span className="text-sm font-light px-2 pb-2">Compare before and after add/delete review</span>
                        <div className="flex flex-row bg-neutral-900 px-2 py-2 justify-between">
                            <div className="flex justify-center items-center">  
                                No Body
                            </div>
                            <button onClick={query_14}
                            className="mr-5 bg-blue-700 px-3 py-3 self-center hover:bg-blue-800 transition-all">
                                Send Request
                            </button>
                        </div>   
                    </div>
                </div>
            </div>
        </main>
    );
}

export default TestCasePage;