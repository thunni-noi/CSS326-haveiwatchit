import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { HomePage, LoginPage, RegisterPage } from "./pages/PageIndex";
import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import ParallaxBackground from "./components/ParallaxBg";
import NotFound from "./components/NotFound";

axios.defaults.withCredentials = true;

function App(){
  
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("/api/auth/me");
        setUser(res.data.user);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }


  return (
    <Router>
      <Navbar user={user} setUser={setUser}/>
      < ParallaxBackground />
      <Routes>
        <Route path="/" element = {<HomePage user={user} error={error}/>}></Route>
        <Route path="/login" element = {user ? <Navigate to="/" /> : <LoginPage setUser={setUser} />}></Route>
        <Route path="/register" element = {user ? <Navigate to="/" /> : <RegisterPage user={user} setUser={setUser}/>}></Route>
        <Route path="*" element={<NotFound />}></Route>
      </Routes>
    </Router>
  );
}

export default App;