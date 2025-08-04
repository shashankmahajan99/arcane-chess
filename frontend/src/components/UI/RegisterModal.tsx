import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Modal } from './Modal';

export const RegisterModal: React.FC = () => {
  const {
    showRegisterModal,
    isLoading,
    error,
    register,
    hideModals,
    showLogin,
  } = useAuthStore();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [validation, setValidation] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!showRegisterModal) {
      setFormData({ username: '', email: '', password: '', confirmPassword: '' });
      setValidation({ username: '', email: '', password: '', confirmPassword: '' });
    }
  }, [showRegisterModal]);

  const validateForm = () => {
    const errors = { username: '', email: '', password: '', confirmPassword: '' };

    if (!formData.username) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username = 'Username can only contain letters, numbers, and underscores';
    }

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Invalid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidation(errors);
    return !errors.username && !errors.email && !errors.password && !errors.confirmPassword;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const success = await register(formData.username, formData.email, formData.password);
    if (success) {
      // Modal will be closed by the store
      setFormData({ username: '', email: '', password: '', confirmPassword: '' });
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

  if (!showRegisterModal) return null;

  return (
    <Modal onClose={hideModals} title="Join Arcane Chess">
      <div className="w-full max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username Field */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 rounded-lg bg-gray-800 border ${
                validation.username ? 'border-red-500' : 'border-gray-600'
              } text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
              placeholder="Choose a unique username"
              disabled={isLoading}
            />
            {validation.username && (
              <p className="mt-1 text-sm text-red-400">{validation.username}</p>
            )}
          </div>

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
              placeholder="Create a strong password"
              disabled={isLoading}
            />
            {validation.password && (
              <p className="mt-1 text-sm text-red-400">{validation.password}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 rounded-lg bg-gray-800 border ${
                validation.confirmPassword ? 'border-red-500' : 'border-gray-600'
              } text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
              placeholder="Confirm your password"
              disabled={isLoading}
            />
            {validation.confirmPassword && (
              <p className="mt-1 text-sm text-red-400">{validation.confirmPassword}</p>
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
                : 'bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500'
            } text-white focus:outline-none`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Creating Account...
              </div>
            ) : (
              'Create Account'
            )}
          </button>

          {/* Switch to Login */}
          <div className="text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={showLogin}
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                disabled={isLoading}
              >
                Sign in here
              </button>
            </p>
          </div>

          {/* Terms */}
          <div className="text-center border-t border-gray-600 pt-4">
            <p className="text-xs text-gray-500">
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </form>
      </div>
    </Modal>
  );
};