import React, { createContext, useState, useEffect, ReactNode } from "react";
import { useGoogleLogin, googleLogout } from "@react-oauth/google";

interface User {
    id: number;
    name: string;
    email: string;
    picture: string;
}

interface AuthContextType {
    user: User | null;
    login: () => void;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    const login = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                // Fetch user info using the access_token
                const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });

                const googleUser = await res.json();

                // Send user info to the backend for authentication/storage
                const backendRes = await fetch("http://localhost:5000/auth/google", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: googleUser.email, name: googleUser.name, picture: googleUser.picture }),
                });

                const data = await backendRes.json();
                if (backendRes.ok) {
                    setUser(data.user);
                    localStorage.setItem("token", data.token);
                    localStorage.setItem("user", JSON.stringify(data.user));
                } else {
                    alert("Authentication failed");
                }
            } catch (error) {
                console.error("Login error:", error);
            }
        },
        onError: () => console.error("Login Failed"),
    });

    const logout = () => {
        googleLogout();
        setUser(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    };

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) setUser(JSON.parse(storedUser));
    }, []);

    return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};
