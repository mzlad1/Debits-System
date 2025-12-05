import React from 'react'
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(email, password);
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (error) {
      console.error('Auth error:', error);
      if (error.code === 'auth/invalid-credential') {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      } else if (error.code === 'auth/email-already-in-use') {
        setError('البريد الإلكتروني مستخدم مسبقاً');
      } else if (error.code === 'auth/weak-password') {
        setError('كلمة المرور ضعيفة جداً');
      } else if (error.code === 'auth/invalid-email') {
        setError('البريد الإلكتروني غير صحيح');
      } else {
        setError('حدث خطأ، يرجى المحاولة مرة أخرى');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ maxWidth: '450px', width: '100%' }}>
        <div className="text-center mb-xl">
          <h1 className="navbar-brand" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
            نظام إدارة الديون
          </h1>
          <p className="text-muted">إدارة احترافية لحسابات الزبائن</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">البريد الإلكتروني</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="example@domain.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">كلمة المرور</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'جاري المعالجة...' : (isRegister ? 'إنشاء حساب' : 'تسجيل الدخول')}
          </button>

          <div className="text-center mt-md">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
            >
              {/* {isRegister ? 'لديك حساب؟ سجل الدخول' : 'ليس لديك حساب؟ أنشئ حساباً'} */}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
