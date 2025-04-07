import React from "react";
import { useAuth } from "./useAuth";
import { GoogleLogin } from "@react-oauth/google";

const Login: React.FC = () => {
    const { login } = useAuth();

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-2xl font-bold mb-4">Login</h1>
            <GoogleLogin onSuccess={login} onError={() => console.error("Login Failed")} />
        </div>
    );
};

export default Login;
