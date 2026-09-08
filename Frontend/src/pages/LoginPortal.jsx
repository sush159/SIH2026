import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/login.css';

export default function LoginPortal() {
  const navigate = useNavigate();
  const [adminId, setAdminId] = useState('admin');
  const [adminPass, setAdminPass] = useState('password123');
  const [fieldId, setFieldId] = useState('officer_104');
  const [fieldPin, setFieldPin] = useState('1234');

  const handleCitizenLogin = (e) => {
    e.preventDefault();
    navigate('/');
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    navigate('/admin');
  };

  const handleFieldLogin = (e) => {
    e.preventDefault();
    navigate('/field');
  };

  return (
    <div className="login-page-body">
      {/* Top Header */}
      <header className="login-header">
        <div className="brand-wrap">
          <div className="brand-logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
          </div>
          <div className="brand-text">
            <h1>ResilientGuard</h1>
            <p>Disaster Early Warning &amp; Response Gateway</p>
          </div>
        </div>

        <div className="satcom-pill">
          <span className="pulse-dot"></span>
          <span>Mesh Online</span>
        </div>
      </header>

      {/* Main Role Selection Section */}
      <main className="login-container">
        <div className="hero-title-wrap">
          <span className="hero-tag">System Access</span>
          <h2>Select Role to Login</h2>
          <p>Choose your operational role to access the corresponding dashboard.</p>
        </div>

        <div className="role-grid">
          {/* CARD 1: USER / CITIZEN */}
          <div className="role-card citizen">
            <div className="role-card-header">
              <div className="role-avatar citizen">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="role-info">
                <h3>User</h3>
                <p>Citizen Safety &amp; Disaster Alerts</p>
              </div>
            </div>

            <button type="button" className="btn-launch-portal citizen" onClick={handleCitizenLogin} id="btnLaunchCitizen">
              <span>Enter as User</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>

          {/* CARD 2: ADMIN */}
          <div className="role-card admin">
            <div className="role-card-header">
              <div className="role-avatar admin">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div className="role-info">
                <h3>Admin</h3>
                <p>DDMA Disaster Control Center</p>
              </div>
            </div>

            <form onSubmit={handleAdminLogin} className="role-auth-box">
              <div className="auth-input-row">
                <input
                  type="text"
                  className="auth-input"
                  id="adminUser"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  placeholder="Admin ID"
                />
                <input
                  type="password"
                  className="auth-input"
                  id="adminPass"
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  placeholder="Password"
                />
              </div>
              <button type="submit" className="btn-launch-portal admin" id="btnLaunchAdmin">
                <span>Login as Admin</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </form>
          </div>

          {/* CARD 3: FIELD OFFICER */}
          <div className="role-card field">
            <div className="role-card-header">
              <div className="role-avatar field">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                </svg>
              </div>
              <div className="role-info">
                <h3>Field Officer</h3>
                <p>SDRF Patrol &amp; Quick Response</p>
              </div>
            </div>

            <form onSubmit={handleFieldLogin} className="role-auth-box">
              <div className="auth-input-row">
                <input
                  type="text"
                  className="auth-input"
                  id="fieldUser"
                  value={fieldId}
                  onChange={(e) => setFieldId(e.target.value)}
                  placeholder="Badge ID"
                />
                <input
                  type="password"
                  className="auth-input"
                  id="fieldPass"
                  value={fieldPin}
                  onChange={(e) => setFieldPin(e.target.value)}
                  placeholder="PIN"
                />
              </div>
              <button type="submit" className="btn-launch-portal field" id="btnLaunchField">
                <span>Login as Field Officer</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="login-footer">
        ResilientGuard Incident Management System &bull; DDMA &amp; SDRF
      </footer>
    </div>
  );
}
