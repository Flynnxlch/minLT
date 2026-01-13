import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CABANG_OPTIONS = [
  { code: 'ID', label: 'Indonesia (ID)' },
  { code: 'US', label: 'United States (US)' },
  { code: 'GB', label: 'United Kingdom (GB)' },
  { code: 'JP', label: 'Japan (JP)' },
  { code: 'AU', label: 'Australia (AU)' },
  { code: 'SG', label: 'Singapore (SG)' },
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Register form state
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    cabang: 'ID',
    nip: '',
    password: '',
    confirmPassword: '',
  });
  const [registerErrors, setRegisterErrors] = useState({});
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Invalid email or password');
    }

    setIsLoading(false);
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (registerErrors[name]) {
      setRegisterErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateRegister = () => {
    const newErrors = {};

    if (!formData.nama.trim()) {
      newErrors.nama = 'Nama is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.cabang) {
      newErrors.cabang = 'Cabang is required';
    }

    if (!formData.nip.trim()) {
      newErrors.nip = 'NIP is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setRegisterErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (!validateRegister()) {
      return;
    }

    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Store registration request
    const registrationRequest = {
      ...formData,
      requestedAt: new Date().toISOString(),
      status: 'pending',
    };
    const existingRequests = JSON.parse(localStorage.getItem('minlt:registration-requests') || '[]');
    existingRequests.push(registrationRequest);
    localStorage.setItem('minlt:registration-requests', JSON.stringify(existingRequests));

    setIsLoading(false);
    setShowSuccessPopup(true);
  };

  const handleClosePopup = () => {
    setShowSuccessPopup(false);
    // Reset form and switch back to login
    setFormData({
      nama: '',
      email: '',
      cabang: 'ID',
      nip: '',
      password: '',
      confirmPassword: '',
    });
    setIsRegisterMode(false);
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setError('');
    setRegisterErrors({});
  };

  const inputBase =
    'w-full pl-10 pr-4 py-2.5 border rounded-lg bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0c9361] dark:focus:ring-[#0c9361] transition-colors';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0c9361] via-[#0d6efd] to-[#198754] p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm mb-4">
            <i className="bi bi-shield-check text-white text-4xl"></i>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">MinLT RMS</h1>
          <p className="text-white/80 text-sm">Risk Management System</p>
        </div>

        {/* Login/Register Card */}
        <div className="bg-white dark:bg-[var(--color-card-bg-dark)] rounded-2xl shadow-2xl p-8 border border-white/20 dark:border-[var(--color-card-border-dark)] overflow-hidden relative">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              {isRegisterMode ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isRegisterMode ? 'Sign up to get started' : 'Sign in to continue to your account'}
            </p>
          </div>

          {/* Form Container with Transition */}
          <div className="relative overflow-hidden">
            {/* Login Form */}
            <div
              className={`transition-all duration-500 ease-in-out ${
                isRegisterMode
                  ? 'opacity-0 absolute inset-0 translate-x-[-100%] pointer-events-none'
                  : 'opacity-100 relative translate-x-0 pointer-events-auto'
              }`}
            >
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <i className="bi bi-exclamation-circle text-red-500 dark:text-red-400"></i>
                    <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="bi bi-envelope text-gray-400 dark:text-gray-500"></i>
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0c9361] dark:focus:ring-[#0c9361] transition-colors"
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="bi bi-lock-fill text-gray-400 dark:text-gray-500"></i>
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0c9361] dark:focus:ring-[#0c9361] transition-colors"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-[#0c9361] border-gray-300 dark:border-gray-600 rounded focus:ring-[#0c9361]"
                />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Remember me</span>
              </label>
              <a
                href="#"
                className="text-sm text-[#0c9361] dark:text-[#0c9361] hover:underline"
                onClick={(e) => e.preventDefault()}
              >
                Forgot password?
              </a>
            </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-[#0c9361] hover:bg-[#0a7a4f] text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <i className="bi bi-arrow-repeat animate-spin"></i>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <i className="bi bi-arrow-right"></i>
                    </>
                  )}
                </button>
              </form>

              {/* Demo Credentials */}
              {!isRegisterMode && (
                <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">Demo Credentials:</p>
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    Email: <span className="font-mono">admin@adminlte.io</span>
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    Password: <span className="font-mono">admin123</span>
                  </p>
                </div>
              )}
            </div>

            {/* Register Form */}
            <div
              className={`transition-all duration-500 ease-in-out ${
                isRegisterMode
                  ? 'opacity-100 relative translate-x-0 pointer-events-auto'
                  : 'opacity-0 absolute inset-0 translate-x-[100%] pointer-events-none'
              }`}
            >
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                {/* Nama Input */}
                <div>
                  <label htmlFor="nama" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nama
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i className="bi bi-person text-gray-400 dark:text-gray-500"></i>
                    </div>
                    <input
                      id="nama"
                      name="nama"
                      type="text"
                      value={formData.nama}
                      onChange={handleRegisterChange}
                      className={`${inputBase} ${registerErrors.nama ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                      placeholder="Enter your name"
                      required
                    />
                  </div>
                  {registerErrors.nama && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{registerErrors.nama}</p>}
                </div>

                {/* Email Input */}
                <div>
                  <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i className="bi bi-envelope text-gray-400 dark:text-gray-500"></i>
                    </div>
                    <input
                      id="reg-email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleRegisterChange}
                      className={`${inputBase} ${registerErrors.email ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  {registerErrors.email && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{registerErrors.email}</p>}
                </div>

                {/* Cabang Input */}
                <div>
                  <label htmlFor="cabang" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cabang
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i className="bi bi-geo-alt text-gray-400 dark:text-gray-500"></i>
                    </div>
                    <select
                      id="cabang"
                      name="cabang"
                      value={formData.cabang}
                      onChange={handleRegisterChange}
                      className={`${inputBase} ${registerErrors.cabang ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                      required
                    >
                      {CABANG_OPTIONS.map((opt) => (
                        <option key={opt.code} value={opt.code}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {registerErrors.cabang && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{registerErrors.cabang}</p>}
                </div>

                {/* NIP Input */}
                <div>
                  <label htmlFor="nip" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    NIP
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i className="bi bi-card-text text-gray-400 dark:text-gray-500"></i>
                    </div>
                    <input
                      id="nip"
                      name="nip"
                      type="text"
                      value={formData.nip}
                      onChange={handleRegisterChange}
                      className={`${inputBase} ${registerErrors.nip ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                      placeholder="Enter your NIP"
                      required
                    />
                  </div>
                  {registerErrors.nip && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{registerErrors.nip}</p>}
                </div>

                {/* Password Input */}
                <div>
                  <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i className="bi bi-lock-fill text-gray-400 dark:text-gray-500"></i>
                    </div>
                    <input
                      id="reg-password"
                      name="password"
                      type={showRegisterPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleRegisterChange}
                      className={`${inputBase} pr-12 ${registerErrors.password ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <i className={`bi ${showRegisterPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                    </button>
                  </div>
                  {registerErrors.password && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{registerErrors.password}</p>}
                </div>

                {/* Confirm Password Input */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i className="bi bi-lock-fill text-gray-400 dark:text-gray-500"></i>
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleRegisterChange}
                      className={`${inputBase} pr-12 ${registerErrors.confirmPassword ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                      placeholder="Confirm your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <i className={`bi ${showConfirmPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                    </button>
                  </div>
                  {registerErrors.confirmPassword && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{registerErrors.confirmPassword}</p>}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-[#0c9361] hover:bg-[#0a7a4f] text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <i className="bi bi-arrow-repeat animate-spin"></i>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit</span>
                      <i className="bi bi-check-circle"></i>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isRegisterMode ? (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-[#0c9361] dark:text-[#0c9361] hover:underline"
                  >
                    Sign In
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-[#0c9361] dark:text-[#0c9361] hover:underline"
                  >
                    Sign up
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 text-center">
          <p className="text-xs text-white/60">© 2024 MinLT RMS. All rights reserved.</p>
        </div>

        {/* Success Popup */}
        {showSuccessPopup && (
          <>
            <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 transition-opacity" onClick={handleClosePopup} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div
                className="w-full max-w-md bg-white dark:bg-[var(--color-card-bg-dark)] rounded-lg shadow-2xl border border-gray-200 dark:border-[var(--color-card-border-dark)] pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                    <i className="bi bi-check-circle text-green-600 dark:text-green-400 text-3xl"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Registration Submitted</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                    Terima kasih sudah melakukan registrasi, Mohon tunggu persetujuan pembuatan akun.
                  </p>
                  <button
                    type="button"
                    onClick={handleClosePopup}
                    className="w-full px-4 py-2 bg-[#0c9361] hover:bg-[#0a7a4f] text-white font-semibold rounded-lg transition-colors"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

