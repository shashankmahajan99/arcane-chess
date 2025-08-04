import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Modal } from './Modal';

export const LoginModal: React.FC = () => {
  const {
    showLoginModal,
    isLoading,
    error,
    login,
    hideModals,
    showRegister,
  } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [validation, setValidation] = useState({
    email: '',
    password: '',
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!showLoginModal) {
      setFormData({ email: '', password: '' });
      setValidation({ email: '', password: '' });
    }
  }, [showLoginModal]);

  const validateForm = () => {
    const errors = { email: '', password: '' };

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Invalid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidation(errors);
    return !errors.email && !errors.password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const success = await login(formData.email, formData.password);
    if (success) {
      // Modal will be closed by the store
      setFormData({ email: '', password: '' });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error when user starts typing
    if (validation[name as keyof typeof validation]) {
      setValidation(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (!showLoginModal) return null;

  return (
    <Modal onClose={hideModals} title="Welcome Back">
      <div className="w-full max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 rounded-lg bg-gray-800 border ${
                validation.email ? 'border-red-500' : 'border-gray-600'
              } text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
              placeholder="Enter your email"
              disabled={isLoading}
            />
            {validation.email && (
              <p className="mt-1 text-sm text-red-400">{validation.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 rounded-lg bg-gray-800 border ${
                validation.password ? 'border-red-500' : 'border-gray-600'
              } text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
              placeholder="Enter your password"
              disabled={isLoading}
            />
            {validation.password && (
              <p className="mt-1 text-sm text-red-400">{validation.password}</p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-900/50 border border-red-500">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              isLoading
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
            } text-white focus:outline-none`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Signing In...
              </div>
            ) : (
              'Sign In'
            )}
          </button>

          {/* Switch to Register */}
          <div className="text-center">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={showRegister}
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                disabled={isLoading}
              >
                Create one here
              </button>
            </p>
          </div>

          {/* Guest Mode */}
          <div className="text-center border-t border-gray-600 pt-4">
            <button
              type="button"
              onClick={hideModals}
              className="text-gray-400 hover:text-gray-300 text-sm transition-colors"
              disabled={isLoading}
            >
              Continue as Guest (Limited Features)
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};