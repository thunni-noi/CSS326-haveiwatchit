import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Register = ({ setUser }) => {

    const [form, setForm] = useState({
        username: "",
        email: "",
        password: ""
    });
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post("/api/auth/register", form);
            setUser(res.data.user);
            navigate("/")

        } catch (err){
            setError(err.response?.data?.message ?? "Registration Failed!");
        }
    }

    return <div className="min-h-[80vh] flex items-center justify-center p-4">
        <form className="bg-white p-8 rounded-lg shadow-xl shadow-blue-500/50 w-full max-w-lg text-center backdrop-blue-md" onSubmit={handleSubmit}>
            <h2 className="text-2xl mb-6 font-bold text-center text-gray-800">Register</h2>
            {error && <p className="text-red-500 mb-4">{error} </p>}
            <input type="text" placeholder="username" className="border p-2 w-full mb-3" value={form.username} onChange={(e) => setForm({...form, username:e.target.value})} /> 
            <input type="email" placeholder="email" className="border p-2 w-full mb-3" value={form.email} onChange={(e) => setForm({...form, email:e.target.value})} /> 
            <input type="password" placeholder="password" className="border p-2 w-full mb-3" value={form.password} onChange={(e) => setForm({...form, password:e.target.value})} /> 
            <button className="bg-blue-500 text-white p-2 w-full">Register</button>
        </form>
    </div>
}

export default Register;