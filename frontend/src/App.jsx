import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import axios from "axios";
import { HomePage, LoginPage, RegisterPage, CollectionsPage } from "./pages/PageIndex";
import AdminPage from "./pages/Admin";
import SubmissionModeration from "./pages/SubmissionModeration";
import WatchlistPage from "./pages/Watchlist";
import CollectionDetailPage from "./pages/CollectionDetail";
import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import PageBg from "./components/PageBg";
import LoadingPlaceHolder from "./components/LoadingScreen";
import NotFound from "./components/NotFound";
import ShowDetails from "./pages/ShowDetails";
import Account from "./pages/Account";
import RequestPage from "./pages/RequestShow";

axios.defaults.withCredentials = true;

function AppRoutes({ user, setUser, error }) {
  const location = useLocation();
  const isStaffPage = ["/admin", "/moderation"].includes(location.pathname);
  const canModerate = ["admin", "moderator"].includes(user?.role);

  return (
    <>
      <Navbar user={user} setUser={setUser} />
      <PageBg hideCharacter={isStaffPage} />
      <Routes>
        <Route path="/" element={<HomePage user={user} error={error} />} />
        <Route path="/watchlist" element={<WatchlistPage user={user} />} />
        <Route path="/collections" element={<CollectionsPage user={user} />} />
        <Route path="/collections/share/:uuid" element={<CollectionDetailPage shared />} />
        <Route path="/collections/:id" element={<CollectionDetailPage />} />
        <Route path="/request-new" element={<RequestPage user={user} />} />
        <Route path="/login"element={user ? <Navigate to="/" /> : <LoginPage setUser={setUser} />}/>
        <Route
          path="/register"
          element={user ? <Navigate to="/" /> : <RegisterPage user={user} setUser={setUser} />}
        />
        <Route
            path="/account"
            element={user? <Account user={user} setUser={setUser} />: <Navigate to="/login" replace />
            }/>
        <Route path="/shows/:showId" element={<ShowDetails user={user} />} />
        <Route
          path="/admin"
          element={user?.role === "admin" ? <AdminPage user={user} /> : <Navigate to="/" />}
        />
        <Route
          path="/moderation"
          element={canModerate ? <SubmissionModeration user={user} /> : <Navigate to="/" />}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

function App(){
  const [user, setUser] = useState(null);
  const [error] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("/api/auth/me");
        setUser(res.data.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  if (loading) {
        return (
            <LoadingPlaceHolder className="relative w-full h-screen bg-neutral-900"/>
        );
    }

  return (
    <Router>
      <AppRoutes user={user} setUser={setUser} error={error} />
    </Router>
  );
}

export default App;
