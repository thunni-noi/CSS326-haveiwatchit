import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import axios from "axios";
import { HomePage, LoginPage, RegisterPage, CollectionsPage } from "./pages/PageIndex";
import AdminPage from "./pages/Admin";
import WatchlistPage from "./pages/Watchlist";
import CollectionDetailPage from "./pages/CollectionDetail";
import ReviewPage from "./pages/ReviewPage";
import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import ParallaxBackground from "./components/ParallaxBg";
import LoadingPlaceHolder from "./components/LoadingScreen";
import NotFound from "./components/NotFound";

axios.defaults.withCredentials = true;

function AppRoutes({ user, setUser, error }) {
  const location = useLocation();
  const isAdminPage = location.pathname === "/admin";

  return (
    <>
      <Navbar user={user} setUser={setUser} />
      <ParallaxBackground hideCharacter={isAdminPage} />
      <Routes>
        <Route path="/" element={<HomePage user={user} error={error} />} />
        <Route path="/watchlist" element={<WatchlistPage user={user} />} />
        <Route path="/collections" element={<CollectionsPage user={user} />} />
        <Route path="/collections/share/:uuid" element={<CollectionDetailPage shared />} />
        <Route path="/collections/:id" element={<CollectionDetailPage />} />
        <Route path="/shows/:id" element={<ReviewPage key={`${location.pathname}:${user?.id ?? "guest"}`} user={user} />} />
        <Route
          path="/login"
          element={user ? <Navigate to="/" /> : <LoginPage setUser={setUser} />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/" /> : <RegisterPage user={user} setUser={setUser} />}
        />
        <Route
          path="/admin"
          element={user?.role === "admin" ? <AdminPage user={user} /> : <Navigate to="/" />}
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
