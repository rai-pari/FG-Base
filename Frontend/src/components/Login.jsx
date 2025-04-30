import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
 
const Login = ({ setIsAuthenticated }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
 
    const handleLogin = (e) => {
        e.preventDefault();
 
 
        if (username === "jayesh@123" && password === "password") {
 
            setIsAuthenticated(true);
            navigate("/");
        } else {
            alert("Invalid credentials! Try again.");
        }
    };
 
    return (
        <div className="flex items-center justify-center h-screen bg-red-500">
            <div className="bg-white shadow-lg rounded-lg p-8 w-96">
 
                <div className="flex justify-center mb-6">
                    <img src="/FaceGenie Logo.png" alt="FaceGenie Logo" className="w-40 h-auto" />
                </div>
 
                <form onSubmit={handleLogin}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Username</label>
                        <input
                            type="text"
                            placeholder="Enter username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                        <input
                            type="password"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600 transition"
                    >
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
};
 
export default Login;