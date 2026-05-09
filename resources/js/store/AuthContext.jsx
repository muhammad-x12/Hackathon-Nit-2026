import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            const savedUser = localStorage.getItem('user');

            if (token) {
                try {
                    const res = await api.get('/auth/me');
                    const userData = res.data.user;
                    const role = res.data.role;
                    const primaryRole = Array.isArray(role) ? role[0] : role;
                    const fullUser = { ...userData, role, primaryRole };
                    localStorage.setItem('user', JSON.stringify(fullUser));
                    setUser(fullUser);
                } catch (e) {
                    if (e.response?.status === 401) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        setUser(null);
                    } else if (savedUser) {
                        try {
                            setUser(JSON.parse(savedUser));
                        } catch (err) {
                            localStorage.removeItem('user');
                        }
                    }
                }
                setLoading(false);
                return;
            }

            if (savedUser) {
                try {
                    setUser(JSON.parse(savedUser));
                } catch (e) {
                    localStorage.removeItem('user');
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user: userData, role } = response.data;

            // Store details - role is returned as an array from Spatie
            const primaryRole = Array.isArray(role) ? role[0] : role;
            const fullUser = { ...userData, role: role, primaryRole };
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(fullUser));

            setUser(fullUser);
            return { success: true, role: primaryRole, roles: role };
        } catch (error) {
            let errorMsg = 'Login failed';
            const resData = error.response?.data;

            if (resData?.errors && typeof resData.errors === 'object') {
                const keys = Object.keys(resData.errors);
                if (keys.length > 0) {
                    const firstError = resData.errors[keys[0]];
                    errorMsg = Array.isArray(firstError) ? firstError[0] : firstError;
                } else if (resData.message) {
                    errorMsg = resData.message;
                }
            } else if (resData?.message) {
                errorMsg = resData.message;
            } else if (error.message) {
                errorMsg = error.message;
            }

            return {
                success: false,
                message: String(errorMsg)
            };
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            window.location.href = '/login';
        }
    };

    const isAdmin = () => {
        const roles = Array.isArray(user?.role) ? user.role : [user?.role];
        return roles.includes('super_admin');
    };
    const isSchool = () => {
        const roles = Array.isArray(user?.role) ? user.role : [user?.role];
        return roles.includes('school');
    };
    const isSupplier = () => {
        const roles = Array.isArray(user?.role) ? user.role : [user?.role];
        return roles.includes('supplier');
    };
    const isCustomer = () => {
        const roles = Array.isArray(user?.role) ? user.role : [user?.role];
        return roles.includes('customer');
    };

    const updateUser = React.useCallback((updatedFields) => {
        setUser(prev => {
            const newUser = { ...prev, ...updatedFields };
            localStorage.setItem('user', JSON.stringify(newUser));
            return newUser;
        });
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, updateUser, isAdmin, isSchool, isSupplier, isCustomer }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
