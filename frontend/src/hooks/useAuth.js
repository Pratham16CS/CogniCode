/**
 * Custom hooks for auth state management.
 */

import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useAppStore from "../store/appStore";
import { authAPI } from "../api/client";

export function useAuth() {
    const { token, user, setAuth, logout: storeLogout } = useAppStore();
    const navigate = useNavigate();

    const login = useCallback(
        async (email, password) => {
            const res = await authAPI.login({ email, password });
            setAuth(res.data.access_token, res.data.user);
            navigate("/home");
        },
        [setAuth, navigate]
    );

    const register = useCallback(
        async (email, username, password) => {
            const res = await authAPI.register({ email, username, password });
            setAuth(res.data.access_token, res.data.user);
            navigate("/home");
        },
        [setAuth, navigate]
    );

    const logout = useCallback(() => {
        storeLogout();
        navigate("/");
    }, [storeLogout, navigate]);

    return {
        token,
        user,
        isAuthenticated: !!token,
        login,
        register,
        logout,
    };
}
