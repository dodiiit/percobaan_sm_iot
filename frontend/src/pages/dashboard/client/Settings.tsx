import React, { useState, useEffect, Fragment } from 'react';
import { 
  Cog6ToothIcon, 
  UserCircleIcon, 
  BellIcon, 
  LockClosedIcon, 
  GlobeAltIcon, 
  CreditCardIcon,
  ArrowPathIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Switch } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import api from '../../../services/api';
import { mockApi, shouldUseMockApi } from '../../../services/mockApi';
import { toast } from 'react-toastify';

interface CompanyProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  tax_id: string;
  website: string;
  logo_url: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  avatar_url: string;
}

const Settings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>('profile');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>({
    id: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    country: '',
    tax_id: '',
    website: '',
    logo_url: ''
  });
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: '',
    name: '',
    email: '',
    phone: '',
    role: '',
    avatar_url: ''
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [notificationSettings, setNotificationSettings] = useState({
    email_alerts: true,
    sms_alerts: false,
    low_credit_alerts: true,
    payment_notifications: true,
    maintenance_alerts: true,
    weekly_reports: false,
    monthly_reports: true
  });
  const [paymentSettings, setPaymentSettings] = useState({
    default_payment_method: 'bank_transfer',
    auto_top_up: false,
    auto_top_up_threshold: 50000,
    auto_top_up_amount: 100000
  });
  const [languageSettings, setLanguageSettings] = useState({
    language: 'en',
    date_format: 'MM/DD/YYYY',
    time_format: '12h',
    currency: 'IDR'
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      if (shouldUseMockApi()) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock company profile data
        setCompanyProfile({
          id: 'comp-001',
          name: 'PT Aqua Mandiri',
          email: 'info@aquamandiri.com',
          phone: '+62 21 5555 6666',
          address: 'Jl. Sudirman No. 123',
          city: 'Jakarta',
          postal_code: '12190',
          country: 'Indonesia',
          tax_id: '01.234.567.8-901.000',
          website: 'www.aquamandiri.com',
          logo_url: 'https://via.placeholder.com/150'
        });
        
        // Mock user profile data
        setUserProfile({
          id: 'user-001',
          name: 'John Doe',
          email: 'john.doe@aquamandiri.com',
          phone: '+62 812 3456 7890',
          role: 'Client Manager',
          avatar_url: 'https://via.placeholder.com/150'
        });
      } else {
        // Real API calls
        const [companyRes, userRes, notificationRes, paymentRes, languageRes] = await Promise.all([
          api.get('/settings/company'),
          api.get('/settings/profile'),
          api.get('/settings/notifications'),
          api.get('/settings/payment'),
          api.get('/settings/language')
        ]);
        
        if (companyRes.data.status === 'success') {
          setCompanyProfile(companyRes.data.data);
        }
        
        if (userRes.data.status === 'success') {
          setUserProfile(userRes.data.data);
        }
        
        if (notificationRes.data.status === 'success') {
          setNotificationSettings(notificationRes.data.data);
        }
        
        if (paymentRes.data.status === 'success') {
          setPaymentSettings(paymentRes.data.data);
        }
        
        if (languageRes.data.status === 'success') {
          setLanguageSettings(languageRes.data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCompanyProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleUserProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserProfile(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleNotificationChange = (name: string, checked: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [name]: checked }));
  };

  const handlePaymentSettingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numValue = name.includes('amount') || name.includes('threshold') ? Number(value) : value;
    setPaymentSettings(prev => ({ ...prev, [name]: numValue }));
  };

  const handleAutoTopUpChange = (checked: boolean) => {
    setPaymentSettings(prev => ({ ...prev, auto_top_up: checked }));
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLanguageSettings(prev => ({ ...prev, [name]: value }));
    
    // If language is changed, update i18n
    if (name === 'language') {
      i18n.changeLanguage(value);
    }
  };

  const saveCompanyProfile = async () => {
    try {
      setSaving(true);
      
      if (shouldUseMockApi()) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success('Company profile updated successfully');
      } else {
        // Real API call
        const response = await api.put('/settings/company', companyProfile);
        
        if (response.data.status === 'success') {
          toast.success('Company profile updated successfully');
        }
      }
    } catch (error) {
      console.error('Error updating company profile:', error);
      toast.error('Failed to update company profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const saveUserProfile = async () => {
    try {
      setSaving(true);
      
      if (shouldUseMockApi()) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success('User profile updated successfully');
      } else {
        // Real API call
        const response = await api.put('/settings/profile', userProfile);
        
        if (response.data.status === 'success') {
          toast.success('User profile updated successfully');
        }
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      toast.error('Failed to update user profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    // Validate passwords
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New password and confirmation do not match');
      return;
    }
    
    if (passwordData.new_password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    
    try {
      setSaving(true);
      
      if (shouldUseMockApi()) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success('Password changed successfully');
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
      } else {
        // Real API call
        const response = await api.put('/settings/password', {
          current_password: passwordData.current_password,
          new_password: passwordData.new_password
        });
        
        if (response.data.status === 'success') {
          toast.success('Password changed successfully');
          setPasswordData({
            current_password: '',
            new_password: '',
            confirm_password: ''
          });
        }
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password. Please check your current password and try again.');
    } finally {
      setSaving(false);
    }
  };

  const saveNotificationSettings = async () => {
    try {
      setSaving(true);
      
      if (shouldUseMockApi()) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success('Notification settings updated successfully');
      } else {
        // Real API call
        const response = await api.put('/settings/notifications', notificationSettings);
        
        if (response.data.status === 'success') {
          toast.success('Notification settings updated successfully');
        }
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
      toast.error('Failed to update notification settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const savePaymentSettings = async () => {
    try {
      setSaving(true);
      
      if (shouldUseMockApi()) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success('Payment settings updated successfully');
      } else {
        // Real API call
        const response = await api.put('/settings/payment', paymentSettings);
        
        if (response.data.status === 'success') {
          toast.success('Payment settings updated successfully');
        }
      }
    } catch (error) {
      console.error('Error updating payment settings:', error);
      toast.error('Failed to update payment settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const saveLanguageSettings = async () => {
    try {
      setSaving(true);
      
      if (shouldUseMockApi()) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success('Language settings updated successfully');
      } else {
        // Real API call
        const response = await api.put('/settings/language', languageSettings);
        
        if (response.data.status === 'success') {
          toast.success('Language settings updated successfully');
        }
      }
    } catch (error) {
      console.error('Error updating language settings:', error);
      toast.error('Failed to update language settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
            Settings
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your account and application settings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Settings Navigation */}
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
              Settings
            </h3>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'profile'
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <UserCircleIcon className="h-5 w-5 mr-3" />
                Profile
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'security'
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <LockClosedIcon className="h-5 w-5 mr-3" />
                Security
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'notifications'
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <BellIcon className="h-5 w-5 mr-3" />
                Notifications
              </button>
              <button
                onClick={() => setActiveTab('payment')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'payment'
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <CreditCardIcon className="h-5 w-5 mr-3" />
                Payment
              </button>
              <button
                onClick={() => setActiveTab('language')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'language'
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <GlobeAltIcon className="h-5 w-5 mr-3" />
                Language & Region
              </button>
              <button
                onClick={() => setActiveTab('company')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'company'
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Cog6ToothIcon className="h-5 w-5 mr-3" />
                Company Profile
              </button>
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg lg:col-span-3">
          <div className="px-4 py-5 sm:p-6">
            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                  User Profile
                </h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-6">
                  <div className="sm:col-span-6">
                    <div className="flex items-center">
                      <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                        {userProfile.avatar_url ? (
                          <img src={userProfile.avatar_url} alt="User avatar" className="h-full w-full object-cover" />
                        ) : (
                          <UserCircleIcon className="h-full w-full text-gray-300 dark:text-gray-600" />
                        )}
                      </div>
                      <div className="ml-5">
                        <button
                          type="button"
                          className="bg-white dark:bg-gray-700 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Change
                        </button>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          JPG, PNG, or GIF. Max size 2MB.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={userProfile.name}
                      onChange={handleUserProfileChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={userProfile.email}
                      onChange={handleUserProfileChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      name="phone"
                      id="phone"
                      value={userProfile.phone}
                      onChange={handleUserProfileChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Role
                    </label>
                    <input
                      type="text"
                      name="role"
                      id="role"
                      value={userProfile.role}
                      disabled
                      className="mt-1 bg-gray-50 dark:bg-gray-600 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={saveUserProfile}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="-ml-1 mr-2 h-5 w-5" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                  Security Settings
                </h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-base font-medium text-gray-900 dark:text-white">
                      Change Password
                    </h4>
                    <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                      <div className="sm:col-span-2">
                        <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Current Password
                        </label>
                        <input
                          type="password"
                          name="current_password"
                          id="current_password"
                          value={passwordData.current_password}
                          onChange={handlePasswordChange}
                          className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          New Password
                        </label>
                        <input
                          type="password"
                          name="new_password"
                          id="new_password"
                          value={passwordData.new_password}
                          onChange={handlePasswordChange}
                          className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          name="confirm_password"
                          id="confirm_password"
                          value={passwordData.confirm_password}
                          onChange={handlePasswordChange}
                          className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          required
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Password must be at least 8 characters long and include a mix of letters, numbers, and special characters.
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-base font-medium text-gray-900 dark:text-white">
                      Two-Factor Authentication
                    </h4>
                    <div className="mt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Add an extra layer of security to your account by enabling two-factor authentication.
                          </p>
                        </div>
                        <button
                          type="button"
                          className="bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Setup
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-base font-medium text-gray-900 dark:text-white">
                      Login Sessions
                    </h4>
                    <div className="mt-4">
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              Current Session
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Jakarta, Indonesia • Chrome on Windows • IP: 103.xx.xx.xx
                            </p>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400">
                            Active Now
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={changePassword}
                    disabled={saving || !passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <LockClosedIcon className="-ml-1 mr-2 h-5 w-5" />
                        Change Password
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                  Notification Settings
                </h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-base font-medium text-gray-900 dark:text-white">
                      Notification Channels
                    </h4>
                    <div className="mt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="text-sm">
                            <label htmlFor="email_alerts" className="font-medium text-gray-700 dark:text-gray-300">
                              Email Notifications
                            </label>
                            <p className="text-gray-500 dark:text-gray-400">
                              Receive notifications via email
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={notificationSettings.email_alerts}
                          onChange={(checked) => handleNotificationChange('email_alerts', checked)}
                          className={`${
                            notificationSettings.email_alerts ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                          } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                        >
                          <span
                            className={`${
                              notificationSettings.email_alerts ? 'translate-x-6' : 'translate-x-1'
                            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                          />
                        </Switch>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="text-sm">
                            <label htmlFor="sms_alerts" className="font-medium text-gray-700 dark:text-gray-300">
                              SMS Notifications
                            </label>
                            <p className="text-gray-500 dark:text-gray-400">
                              Receive notifications via SMS
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={notificationSettings.sms_alerts}
                          onChange={(checked) => handleNotificationChange('sms_alerts', checked)}
                          className={`${
                            notificationSettings.sms_alerts ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                          } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                        >
                          <span
                            className={`${
                              notificationSettings.sms_alerts ? 'translate-x-6' : 'translate-x-1'
                            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                          />
                        </Switch>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-base font-medium text-gray-900 dark:text-white">
                      Notification Types
                    </h4>
                    <div className="mt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="text-sm">
                            <label htmlFor="low_credit_alerts" className="font-medium text-gray-700 dark:text-gray-300">
                              Low Credit Alerts
                            </label>
                            <p className="text-gray-500 dark:text-gray-400">
                              Get notified when meter credit is running low
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={notificationSettings.low_credit_alerts}
                          onChange={(checked) => handleNotificationChange('low_credit_alerts', checked)}
                          className={`${
                            notificationSettings.low_credit_alerts ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                          } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                        >
                          <span
                            className={`${
                              notificationSettings.low_credit_alerts ? 'translate-x-6' : 'translate-x-1'
                            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                          />
                        </Switch>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="text-sm">
                            <label htmlFor="payment_notifications" className="font-medium text-gray-700 dark:text-gray-300">
                              Payment Notifications
                            </label>
                            <p className="text-gray-500 dark:text-gray-400">
                              Get notified about payment status changes
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={notificationSettings.payment_notifications}
                          onChange={(checked) => handleNotificationChange('payment_notifications', checked)}
                          className={`${
                            notificationSettings.payment_notifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                          } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                        >
                          <span
                            className={`${
                              notificationSettings.payment_notifications ? 'translate-x-6' : 'translate-x-1'
                            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                          />
                        </Switch>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="text-sm">
                            <label htmlFor="maintenance_alerts" className="font-medium text-gray-700 dark:text-gray-300">
                              Maintenance Alerts
                            </label>
                            <p className="text-gray-500 dark:text-gray-400">
                              Get notified about scheduled maintenance
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={notificationSettings.maintenance_alerts}
                          onChange={(checked) => handleNotificationChange('maintenance_alerts', checked)}
                          className={`${
                            notificationSettings.maintenance_alerts ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                          } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                        >
                          <span
                            className={`${
                              notificationSettings.maintenance_alerts ? 'translate-x-6' : 'translate-x-1'
                            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                          />
                        </Switch>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-base font-medium text-gray-900 dark:text-white">
                      Report Notifications
                    </h4>
                    <div className="mt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="text-sm">
                            <label htmlFor="weekly_reports" className="font-medium text-gray-700 dark:text-gray-300">
                              Weekly Reports
                            </label>
                            <p className="text-gray-500 dark:text-gray-400">
                              Receive weekly usage and billing reports
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={notificationSettings.weekly_reports}
                          onChange={(checked) => handleNotificationChange('weekly_reports', checked)}
                          className={`${
                            notificationSettings.weekly_reports ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                          } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                        >
                          <span
                            className={`${
                              notificationSettings.weekly_reports ? 'translate-x-6' : 'translate-x-1'
                            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                          />
                        </Switch>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="text-sm">
                            <label htmlFor="monthly_reports" className="font-medium text-gray-700 dark:text-gray-300">
                              Monthly Reports
                            </label>
                            <p className="text-gray-500 dark:text-gray-400">
                              Receive monthly usage and billing reports
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={notificationSettings.monthly_reports}
                          onChange={(checked) => handleNotificationChange('monthly_reports', checked)}
                          className={`${
                            notificationSettings.monthly_reports ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                          } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                        >
                          <span
                            className={`${
                              notificationSettings.monthly_reports ? 'translate-x-6' : 'translate-x-1'
                            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                          />
                        </Switch>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={saveNotificationSettings}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="-ml-1 mr-2 h-5 w-5" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Payment Settings */}
            {activeTab === 'payment' && (
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                  Payment Settings
                </h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-base font-medium text-gray-900 dark:text-white">
                      Default Payment Method
                    </h4>
                    <div className="mt-4">
                      <select
                        id="default_payment_method"
                        name="default_payment_method"
                        value={paymentSettings.default_payment_method}
                        onChange={handlePaymentSettingChange}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="credit_card">Credit Card</option>
                        <option value="e-wallet">E-Wallet</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-medium text-gray-900 dark:text-white">
                        Automatic Top-up
                      </h4>
                      <Switch
                        checked={paymentSettings.auto_top_up}
                        onChange={handleAutoTopUpChange}
                        className={`${
                          paymentSettings.auto_top_up ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                      >
                        <span
                          className={`${
                            paymentSettings.auto_top_up ? 'translate-x-6' : 'translate-x-1'
                          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                        />
                      </Switch>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Automatically top up meter credit when balance falls below threshold
                    </p>

                    {paymentSettings.auto_top_up && (
                      <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                        <div>
                          <label htmlFor="auto_top_up_threshold" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Threshold Amount (IDR)
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 dark:text-gray-400 sm:text-sm">Rp</span>
                            </div>
                            <input
                              type="number"
                              name="auto_top_up_threshold"
                              id="auto_top_up_threshold"
                              value={paymentSettings.auto_top_up_threshold}
                              onChange={handlePaymentSettingChange}
                              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              placeholder="0"
                              min="10000"
                              step="10000"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="auto_top_up_amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Top-up Amount (IDR)
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 dark:text-gray-400 sm:text-sm">Rp</span>
                            </div>
                            <input
                              type="number"
                              name="auto_top_up_amount"
                              id="auto_top_up_amount"
                              value={paymentSettings.auto_top_up_amount}
                              onChange={handlePaymentSettingChange}
                              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              placeholder="0"
                              min="50000"
                              step="10000"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-base font-medium text-gray-900 dark:text-white">
                      Payment Summary
                    </h4>
                    <div className="mt-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                      <div className="flex justify-between py-1">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Default Payment Method:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {paymentSettings.default_payment_method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Auto Top-up:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {paymentSettings.auto_top_up ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      {paymentSettings.auto_top_up && (
                        <>
                          <div className="flex justify-between py-1">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Threshold:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatCurrency(paymentSettings.auto_top_up_threshold)}
                            </span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Top-up Amount:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatCurrency(paymentSettings.auto_top_up_amount)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={savePaymentSettings}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="-ml-1 mr-2 h-5 w-5" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Language Settings */}
            {activeTab === 'language' && (
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                  Language & Region Settings
                </h3>
                <div className="space-y-6">
                  <div>
                    <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Language
                    </label>
                    <select
                      id="language"
                      name="language"
                      value={languageSettings.language}
                      onChange={handleLanguageChange}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="en">English</option>
                      <option value="id">Bahasa Indonesia</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="date_format" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Date Format
                    </label>
                    <select
                      id="date_format"
                      name="date_format"
                      value={languageSettings.date_format}
                      onChange={handleLanguageChange}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="time_format" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Time Format
                    </label>
                    <select
                      id="time_format"
                      name="time_format"
                      value={languageSettings.time_format}
                      onChange={handleLanguageChange}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="12h">12-hour (AM/PM)</option>
                      <option value="24h">24-hour</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Currency
                    </label>
                    <select
                      id="currency"
                      name="currency"
                      value={languageSettings.currency}
                      onChange={handleLanguageChange}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="IDR">Indonesian Rupiah (IDR)</option>
                      <option value="USD">US Dollar (USD)</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={saveLanguageSettings}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="-ml-1 mr-2 h-5 w-5" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Company Profile */}
            {activeTab === 'company' && (
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                  Company Profile
                </h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-6">
                  <div className="sm:col-span-6">
                    <div className="flex items-center">
                      <div className="h-24 w-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                        {companyProfile.logo_url ? (
                          <img src={companyProfile.logo_url} alt="Company logo" className="h-full w-full object-cover" />
                        ) : (
                          <Cog6ToothIcon className="h-full w-full text-gray-300 dark:text-gray-600" />
                        )}
                      </div>
                      <div className="ml-5">
                        <button
                          type="button"
                          className="bg-white dark:bg-gray-700 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Change Logo
                        </button>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          JPG, PNG, or SVG. Max size 2MB.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Company Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={companyProfile.name}
                      onChange={handleCompanyProfileChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="tax_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tax ID / NPWP
                    </label>
                    <input
                      type="text"
                      name="tax_id"
                      id="tax_id"
                      value={companyProfile.tax_id}
                      onChange={handleCompanyProfileChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={companyProfile.email}
                      onChange={handleCompanyProfileChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      name="phone"
                      id="phone"
                      value={companyProfile.phone}
                      onChange={handleCompanyProfileChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Website
                    </label>
                    <input
                      type="text"
                      name="website"
                      id="website"
                      value={companyProfile.website}
                      onChange={handleCompanyProfileChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-6">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Address
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      rows={3}
                      value={companyProfile.address}
                      onChange={handleCompanyProfileChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      id="city"
                      value={companyProfile.city}
                      onChange={handleCompanyProfileChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      name="postal_code"
                      id="postal_code"
                      value={companyProfile.postal_code}
                      onChange={handleCompanyProfileChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      id="country"
                      value={companyProfile.country}
                      onChange={handleCompanyProfileChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={saveCompanyProfile}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="-ml-1 mr-2 h-5 w-5" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
