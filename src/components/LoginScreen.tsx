import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFirstLogin } from '../hooks/useFirstLogin';
import '../styles/components/LoginScreen.scss';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { signIn, signUp } = useAuth();
  const { trackFirstLogin } = useFirstLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (!email || !password) {
      setError('Compila tutti i campi');
      setLoading(false);
      return;
    }

    // Validazione email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Inserisci un indirizzo email valido');
      setLoading(false);
      return;
    }

    // Validazione password
    if (password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) {
          setError(error.message || 'Errore durante la registrazione');
        } else {
          setMessage('Registrazione completata! Controlla la tua email per confermare l\'account.');
          // Traccia il primo login se la registrazione è andata a buon fine
          if (email) {
            trackFirstLogin(email);
          }
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message || 'Email o password non corretti');
        } else {
          // Traccia il primo login
          trackFirstLogin(email);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante l\'operazione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-container">
        <div className="login-box">
          <div className="login-header">
            <i className="fas fa-plane"></i>
            <h1>Viaggio Soul Dance</h1>
            <p>{isSignUp ? 'Crea un account per votare' : 'Accedi per votare le destinazioni'}</p>
          </div>
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="loginEmail">
                <i className="fas fa-envelope"></i> Email
              </label>
              <input
                type="email"
                id="loginEmail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Inserisci la tua email"
                className="form-input"
                disabled={loading}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="loginPassword">
                <i className="fas fa-lock"></i> Password
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="loginPassword"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isSignUp ? 'Minimo 6 caratteri' : 'Password di accesso'}
                  className="form-input"
                  disabled={loading}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  <i className={`fas fa-${showPassword ? 'eye-slash' : 'eye'}`}></i>
                </button>
              </div>
            </div>
            {error && <p className="login-error">{error}</p>}
            {message && <p className="login-message">{message}</p>}
            <button type="submit" className="login-btn" disabled={loading}>
              <i className={`fas fa-${isSignUp ? 'user-plus' : 'sign-in-alt'}`}></i>
              {loading ? 'Caricamento...' : isSignUp ? 'Registrati' : 'Accedi'}
            </button>
            <div className="login-switch">
              <button
                type="button"
                className="switch-button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                  setMessage('');
                }}
                disabled={loading}
              >
                {isSignUp
                  ? 'Hai già un account? Accedi'
                  : 'Non hai un account? Registrati'}
              </button>
            </div>
          </form>
          <div className="login-footer">
            <p>Viaggio Soul Dance - Dicembre 2024</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;

