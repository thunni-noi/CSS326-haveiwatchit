import { Link, useNavigate } from "react-router-dom";
import { Search as SearchIcon, User as UserIcon, X as XIcon, Menu as MenuIcon } from "lucide-react";
import axios from "axios";
import { useRef, useState, useEffect } from "react";

const UserAvatar = ({ username, iconClass, textClass }) =>
    username ? (
        <span className={`font-semibold leading-none ${textClass} pb-1`}>
            {username.trim().charAt(0).toLowerCase()}
        </span>
    ) : (
        <UserIcon className={iconClass} />
    );


const UserMenu = ({ user, setUser }) => {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = async () => {
        await axios.post("/api/auth/logout");
        setUser(null);
        navigate("/");
    };

    return (
        <div className="relative inline-block">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label="userMenu"
                className="flex h-10 w-10 items-center justify-center rounded-full
                    border border-white/10 bg-[#1b1b20] text-white transition
                    hover:bg-[#25252c]"
            >
                <UserAvatar username={user?.username} iconClass="h-5 w-5" textClass="text-3xl" />
            </button>

            <div
                role="menu"
                className={`absolute right-0 z-50 mt-3 w-64 origin-top-right rounded-md border border-gray-500/20 bg-gray-900 p-4 shadow-2xl transition duration-100 ease-out ${
                    open ? "visible scale-y-100 opacity-100" : "invisible scale-y-110 opacity-0"
                }`}
            >
                <div className="flex flex-col items-center gap-0 pb-3 pt-3 text-white">
                    <UserAvatar username={user?.username} iconClass="h-10 w-10" textClass="text-4xl" />
                    <span className="font-semibold mt-2"> {user ? user.username : "Guests"} </span>
                    <span className="font-light mt-1">{user ? user.role : "Not logged in"}</span>
                </div>
                {(user?.role === "admin") &&
                    (
                        <>
                        <hr className="my-2 border-t-2 border-white/80" />
                        <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => {
                                        navigate("/admin");
                                        setOpen(false);
                                    }}
                                    className="w-full rounded-md bg-[#EFAC61] mt-2 mb-2 py-2 text-sm text-[#000000] transition font-semibold hover:bg-[#ec9532]"
                                >Admin Page</button>
                        </>
                    )
                }
                <hr className="my-2 border-t-2 border-white/80" />
                {user ? (
                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                            handleLogout();
                            setOpen(false);
                        }}
                        className="w-full rounded-md bg-[#303969] mt-2 py-2 text-sm text-white transition font-semibold hover:bg-[#8D8AB5]"
                    >
                        Sign Out
                    </button>
                ) : (
                    <>
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                navigate("/login");
                                setOpen(false);
                            }}
                            className="w-full rounded-md bg-[#303969] mt-2 py-2 text-sm text-white transition font-semibold hover:bg-[#8D8AB5]/50"
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                navigate("/register");
                                setOpen(false);
                            }}
                            className="w-full rounded-md bg-gray-900 mt-2 py-2 border-3 border-[#303969] text-sm text-white transition font-semibold hover:bg-[#8D8AB5]/50"
                        >
                            Register
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

/* TODO: CONNECT THIS TO DATABASE */
const useShowSearch = () => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const q = query.trim();
        if (!q) {
            setResults([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            try {
                const res = await axios.get("/api/shows/search", {
                    params: { q },
                    signal: controller.signal,
                });
                setResults(res.data);
            } catch (err) {
                if (!axios.isCancel(err)) setResults([]);
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }, 300);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [query]);

    return { query, setQuery, results, loading };
};

/* TODO: CONNECT THIS TO DATABASE */
const SearchResults = ({ query, results, loading, onSelect, widthClass, imgBoxClass }) => {
    if (!query.trim() || loading) return null;

    if (results.length === 0) {
        return (
            <div className={`absolute mt-2 ${widthClass} bg-neutral-800 rounded-lg shadow-lg overflow-hidden z-50`}>
                <div className="p-4 text-center text-neutral-400 text-sm">No matched search results</div>
            </div>
        );
    }

    return (
        <div className={`absolute mt-2 ${widthClass} bg-neutral-800 rounded-lg shadow-lg overflow-hidden z-50`}>
            <ul className="divide-y divide-neutral-700">
                {results.map((show) => (
                    <li key={show.id} className="hover:bg-neutral-700">
                        <button
                            type="button"
                            onClick={() => onSelect(show)}
                            className="flex items-center p-3 w-full text-left"
                        >
                            <div className={`${imgBoxClass} bg-neutral-700 overflow-hidden shrink-0`}>
                                {show.poster_url ? (
                                    <img src={show.poster_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-neutral-500 text-xs">
                                        No Image
                                    </div>
                                )}
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-white truncate">{show.title}</p>
                                <p className="text-xs text-neutral-400">{show.release_year ?? ""}</p>
                            </div>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const Navbar = ({ user, setUser }) => {
    const navigate = useNavigate();
    const { query, setQuery, results, loading } = useShowSearch();
    const [searchOpen, setSearchOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleSelect = (show) => {
        setSearchOpen(false);
        setMobileOpen(false);
        setQuery("");
        navigate(`/shows/${show.id}`);
    };

    const handleBlur = (e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setSearchOpen(false);
    };

     const handleLogout = async () => {
        await axios.post("/api/auth/logout");
        setUser(null);
        navigate("/");
    };
  

    return (
        <header className="absolute inset-x-0 top-0 flex w-full z-50 transition-all duration-300 bg-gray-900/50 backdrop-blur-xl">
            <div className="container mx-auto px-4 py-4">
                {/* ===== Top row ===== */}
                <div className="flex items-center justify-between">
                    <a href="/" className="flex items-center">
                        <span className="text-[#9596D6] font-bold text-2xl sm:text-3xl inline-block bg-white/10 px-2 py-1 rounded-md backdrop-blue-xl">
                            HAVE<span className="text-[#EFAC61]">i</span>WATCH<span className="text-[#EFAC61]">it?</span>
                        </span>
                    </a>

                    {/* Desktop nav */}
                    <nav className="hidden md:flex space-x-8">
                        <Link to="/" className={"text-white hover:text-[#9596D6] hover:underline decoration-[#EFAC61] decoration-4 transition-all font-medium"}>Home</Link>
                        <Link to="/watchlist" className={"text-white hover:text-[#9596D6] hover:underline decoration-[#EFAC61] decoration-4 transition-all font-medium"}>Watchlist</Link>
                        <Link to="/collections" className={"text-white hover:text-[#9596D6] hover:underline decoration-[#EFAC61] decoration-4 transition-all font-medium"}>Collections</Link>
                    </nav>

                    {/* Desktop: search */}
                    <div className="hidden md:flex items-center gap-3">
                        <div className="relative search-container" onBlur={handleBlur}>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => {
                                        setQuery(e.target.value);
                                        setSearchOpen(true);
                                    }}
                                    onFocus={() => setSearchOpen(true)}
                                    placeholder="Search movies......."
                                    className="bg-neutral-800/80 text-white px-4 py-2 rounded-2xl h-10 text-sm w-48 focus:w-98 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#D2C9E3]"
                                />
                                <div className="absolute right-3 top-1.5">
                                    <SearchIcon color="#828282" />
                                </div>
                            </div>

                            {searchOpen && (
                                <SearchResults
                                    query={query}
                                    results={results}
                                    loading={loading}
                                    onSelect={handleSelect}
                                    widthClass="w-72"
                                    imgBoxClass="w-10 h-10 rounded"
                                />
                            )}
                        </div>
                        <UserMenu user={user} setUser={setUser} />
                    </div>

                    {/* Mobile: hamburger */}
                    <button
                        type="button"
                        className="md:hidden flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10 transition"
                        onClick={() => setMobileOpen((o) => !o)}
                        aria-label="Toggle menu"
                        aria-expanded={mobileOpen}
                    >
                        {mobileOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
                    </button>
                </div>

                {/* Mobile panel */}
                {mobileOpen && (
                    <div className="md:hidden mt-4 border-t border-white/10 pt-4">
                        <nav className="flex flex-col">
                            {
                                user? (
                                      <div className="flex items-center w-full py-2 text-neutral-300 font-medium">
                                        <span>
                                            Logged in as <span className="text-[#EFAC61]">{user.username}</span>{" "}
                                            (
                                            <button
                                            type="button"
                                            onClick={handleLogout}
                                            className="underline hover:text-[#9596D6] transition-colors"
                                            >
                                            Logout
                                            </button>
                                            )
                                        </span>

                                        {user?.role === "admin" && (
                                              <Link to="/admin" className="ml-auto underline hover:text-[#ff9100] transition-colors">
                                                Admin Page
                                            </Link>
                                        )}
                                        </div>
                                    ): (
                                     <>
                                    <Link to="/login" onClick={() => setMobileOpen(false)} className="text-white hover:text-[#9596D6] hover:underline decoration-[#EFAC61] decoration-4 transition-all font-medium py-2">
                                        Login
                                    </Link>
                                    <Link to="/register" onClick={() => setMobileOpen(false)} className="text-white hover:text-[#9596D6] hover:underline decoration-[#EFAC61] decoration-4 transition-all font-medium py-2">
                                        Register
                                    </Link>
                                </>
                                )
                            }
                            <hr className="my-2 border-t border-white/10"/>
                            <a href="#" onClick={() => setMobileOpen(false)} className="text-white hover:text-[#9596D6] hover:underline decoration-[#EFAC61] decoration-4 transition-all font-medium py-2">Home</a>
                            <a href="#watchlist" onClick={() => setMobileOpen(false)} className="text-white hover:text-[#9596D6] hover:underline decoration-[#EFAC61] decoration-4 transition-all font-medium py-2">Watchlist</a>
                            <a href="#collections" onClick={() => setMobileOpen(false)} className="text-white hover:text-[#9596D6] hover:underline decoration-[#EFAC61] decoration-4 transition-all font-medium py-2">Collections</a>
                        </nav>

                        {/* Search bar */}
                        <div className="mt-4 flex items-center gap-3">
                            <div className="relative flex-1 search-container" onBlur={handleBlur}>
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => {
                                        setQuery(e.target.value);
                                        setSearchOpen(true);
                                    }}
                                    onFocus={() => setSearchOpen(true)}
                                    placeholder="Search movies......."
                                    className="bg-neutral-800/80 text-white px-4 py-2 rounded-2xl h-10 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#D2C9E3]"
                                />
                                <div className="absolute right-3 top-1.5">
                                    <SearchIcon color="#828282" />
                                </div>

                                {searchOpen && (
                                    <SearchResults
                                        query={query}
                                        results={results}
                                        loading={loading}
                                        onSelect={handleSelect}
                                        widthClass="w-full"
                                        imgBoxClass="w-10 h-14 rounded"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Navbar;