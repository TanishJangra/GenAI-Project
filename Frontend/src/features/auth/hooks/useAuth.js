import {useContext} from 'react';
import { AuthContext } from '../auth.context';
import { login, register, logout, getMe } from '../services/auth.api';

export const useAuth = () => {
    const {user, setUser, loading, setLoading} = useContext(AuthContext);
    return {user, setUser, loading, setLoading};

    const handleLogin = async ({email, password}) => {
        setLoading(true);
        try {
            const userData = await login({email, password});
            setUser(userData.user);
        } catch (error) {
            console.error('Login failed:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleRegister = async ({username, email, password}) => {
        setLoading(true);
        try {
            const userData = await register({username, email, password});
            setUser(userData.user);
        }
        catch (error) {
            console.error('Registration failed:', error);
        }
        finally {
            setLoading(false);
        }
    }

    const handleLogout = async () => {
        setLoading(true);
        try {
            await logout();
            setUser(null);
        }
        catch (error) {
            console.error('Logout failed:', error);
        }
        finally {
            setLoading(false);
        }
    }

    const fetchCurrentUser = async () => {
        setLoading(true);
        try {
            const userData = await getMe();
            setUser(userData.user);
        }
        catch (error) {
            console.error('Fetching user data failed:', error);
        }
        finally {
            setLoading(false);
        }
    }

    return {user, loading, handleLogin, handleRegister, handleLogout, fetchCurrentUser};
};
