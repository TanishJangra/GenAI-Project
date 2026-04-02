import React from 'react'
import { useState } from 'react';
import '.././auth.form.scss';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../hooks/useAuth';

const Login = () => {

    const {loading, handleLogin } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        handleLogin({ email, password });
    }

  return (
    <main>
        <div className='form-container'>
            <h1>Login</h1>
            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" name='email' placeholder='Enter Email' value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="input-group">
                    <label htmlFor="password">Password</label>
                    <input type="password" id="password" name='password' placeholder='Enter Password' value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <button className='button primary-button' disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
            <p>Don't have an account? <Link to="/register" >Register</Link></p>
        </div>

    
    </main>
  )
}

export default Login