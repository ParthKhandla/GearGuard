import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import APIService from '../services/apiService';
import '../styles/Auth.css';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState('email'); // email, otp, password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await APIService.post('/users/login', { email, password });
      login(response.data.user, response.data.accessToken);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);

    try {
      await APIService.post('/users/send-otp', { email: forgotEmail });
      setForgotStep('otp');
      setForgotError('');
    } catch (err) {
      setForgotError(err.message || 'Failed to send OTP');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);

    try {
      const response = await APIService.post('/users/verify-otp', {
        email: forgotEmail,
        otp: forgotOtp
      });
      setResetToken(response.data.resetToken);
      setForgotStep('password');
      setForgotError('');
    } catch (err) {
      setForgotError(err.message || 'Invalid OTP');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError('');

    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setForgotError('Password must be at least 6 characters');
      return;
    }

    setForgotLoading(true);

    try {
      await APIService.post('/users/reset-password', {
        email: forgotEmail,
        newPassword,
        resetToken
      });
      setForgotError('');
      setShowForgotModal(false);
      setForgotStep('email');
      setForgotEmail('');
      setForgotOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setResetToken('');
      setError('Password reset successful! You can now login with your new password');
    } catch (err) {
      setForgotError(err.message || 'Failed to reset password');
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotStep('email');
    setForgotEmail('');
    setForgotOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setResetToken('');
    setForgotError('');
  };

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-card">
          <div className="auth-header">
            <div className="logo">⚙️</div>
            <h1>GearGuard</h1>
            <p>Machinery Maintenance Management System</p>
          </div>

          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address <span className="required">*</span></label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password <span className="required">*</span></label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="auth-button">
              {loading ? (
                <>
                  <span className="spinner"></span> Logging in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="forgot-password-link">
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="forgot-btn"
            >
              Forgot Password?
            </button>
          </div>
        </div>
      </div>

      {showForgotModal && (
        <div className="modal-overlay" onClick={closeForgotModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeForgotModal}>✕</button>

            {forgotStep === 'email' && (
              <form onSubmit={handleSendOtp} className="forgot-form">
                <h2>Reset Password</h2>
                <p>Enter your email address to receive an OTP</p>
                {forgotError && <div className="error-message">{forgotError}</div>}
                
                <div className="form-group">
                  <label htmlFor="forgot-email">Email Address <span className="required">*</span></label>
                  <input
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <button type="submit" disabled={forgotLoading} className="auth-button">
                  {forgotLoading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>
            )}

            {forgotStep === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="forgot-form">
                <h2>Verify OTP</h2>
                <p>Enter the 6-digit OTP sent to {forgotEmail}</p>
                {forgotError && <div className="error-message">{forgotError}</div>}
                
                <div className="form-group">
                  <label htmlFor="forgot-otp">OTP Code <span className="required">*</span></label>
                  <input
                    id="forgot-otp"
                    type="text"
                    maxLength="6"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    required
                  />
                </div>

                <button type="submit" disabled={forgotLoading} className="auth-button">
                  {forgotLoading ? 'Verifying...' : 'Verify OTP'}
                </button>

                <button
                  type="button"
                  onClick={() => setForgotStep('email')}
                  className="back-button"
                >
                  Back
                </button>
              </form>
            )}

            {forgotStep === 'password' && (
              <form onSubmit={handleResetPassword} className="forgot-form">
                <h2>Set New Password</h2>
                <p>Enter your new password</p>
                {forgotError && <div className="error-message">{forgotError}</div>}
                
                <div className="form-group">
                  <label htmlFor="new-password">New Password <span className="required">*</span></label>
                  <div className="password-input-wrapper">
                    <input
                      id="new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="confirm-password">Confirm Password <span className="required">*</span></label>
                  <div className="password-input-wrapper">
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={forgotLoading} className="auth-button">
                  {forgotLoading ? 'Resetting...' : 'Reset Password'}
                </button>

                <button
                  type="button"
                  onClick={() => setForgotStep('otp')}
                  className="back-button"
                >
                  Back
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
