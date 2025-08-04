import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

// Initialize i18next
i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'id',
    supportedLngs: ['id', 'en'],
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    react: {
      useSuspense: false,
    },
  });

// Define language resources
const resources = {
  id: {
    translation: {
      // Common
      'app.name': 'IndoWater',
      'app.tagline': 'Sistem Manajemen Meter Air Prabayar',
      
      // Auth
      'auth.login': 'Masuk',
      'auth.register': 'Daftar',
      'auth.logout': 'Keluar',
      'auth.email': 'Email',
      'auth.password': 'Kata Sandi',
      'auth.forgotPassword': 'Lupa Kata Sandi?',
      'auth.resetPassword': 'Atur Ulang Kata Sandi',
      'auth.confirmPassword': 'Konfirmasi Kata Sandi',
      'auth.name': 'Nama',
      'auth.phone': 'Nomor Telepon',
      'auth.role': 'Peran',
      
      // Dashboard
      'dashboard.title': 'Dasbor',
      'dashboard.totalBalance': 'Total Saldo',
      'dashboard.monthlyUsage': 'Penggunaan Bulanan',
      'dashboard.activeMeters': 'Meter Aktif',
      'dashboard.recentPayments': 'Pembayaran Terbaru',
      'dashboard.yourMeters': 'Meter Anda',
      'dashboard.noMeters': 'Tidak ada meter yang ditemukan. Hubungi administrator untuk menambahkan meter ke akun Anda.',
      'dashboard.manage': 'Kelola',
      'dashboard.noPayments': 'Tidak ada pembayaran terbaru.',
      
      // Meters
      'meters.title': 'Meter',
      'meters.details': 'Detail Meter',
      'meters.balance': 'Saldo',
      'meters.topUp': 'Isi Ulang',
      'meters.consumption': 'Konsumsi',
      'meters.status': 'Status',
      'meters.location': 'Lokasi',
      'meters.active': 'Aktif',
      'meters.inactive': 'Tidak Aktif',
      'meters.maintenance': 'Pemeliharaan',
      
      // Payments
      'payments.title': 'Pembayaran',
      'payments.history': 'Riwayat Pembayaran',
      'payments.amount': 'Jumlah',
      'payments.date': 'Tanggal',
      'payments.status': 'Status',
      'payments.method': 'Metode',
      'payments.description': 'Deskripsi',
      'payments.completed': 'Selesai',
      'payments.pending': 'Menunggu',
      'payments.failed': 'Gagal',
      
      // Profile
      'profile.title': 'Profil',
      'profile.edit': 'Edit Profil',
      'profile.changePassword': 'Ubah Kata Sandi',
      'profile.currentPassword': 'Kata Sandi Saat Ini',
      'profile.newPassword': 'Kata Sandi Baru',
      'profile.confirmNewPassword': 'Konfirmasi Kata Sandi Baru',
      'profile.save': 'Simpan',
      'profile.cancel': 'Batal',
      
      // Notifications
      'notifications.title': 'Notifikasi',
      'notifications.markAllRead': 'Tandai Semua Dibaca',
      'notifications.noNotifications': 'Tidak ada notifikasi.',
      
      // Settings
      'settings.title': 'Pengaturan',
      'settings.language': 'Bahasa',
      'settings.theme': 'Tema',
      'settings.darkMode': 'Mode Gelap',
      'settings.lightMode': 'Mode Terang',
      
      // Errors
      'error.generic': 'Terjadi kesalahan. Silakan coba lagi.',
      'error.login': 'Gagal masuk. Periksa email dan kata sandi Anda.',
      'error.register': 'Gagal mendaftar. Silakan coba lagi.',
      'error.network': 'Kesalahan jaringan. Periksa koneksi Anda.',
      'error.notFound': 'Halaman tidak ditemukan.',
      'error.unauthorized': 'Tidak diizinkan. Silakan masuk terlebih dahulu.',
      
      // Success
      'success.login': 'Berhasil masuk!',
      'success.register': 'Berhasil mendaftar!',
      'success.passwordReset': 'Kata sandi berhasil diatur ulang!',
      'success.profileUpdate': 'Profil berhasil diperbarui!',
      'success.passwordChange': 'Kata sandi berhasil diubah!',
      'success.topUp': 'Isi ulang berhasil!',
      
      // Validation
      'validation.required': 'Wajib diisi',
      'validation.email': 'Email tidak valid',
      'validation.passwordLength': 'Kata sandi harus minimal 8 karakter',
      'validation.passwordMatch': 'Kata sandi tidak cocok',
      'validation.phoneNumber': 'Nomor telepon tidak valid',
    },
  },
  en: {
    translation: {
      // Common
      'app.name': 'IndoWater',
      'app.tagline': 'Prepaid Water Meter Management System',
      
      // Auth
      'auth.login': 'Login',
      'auth.register': 'Register',
      'auth.logout': 'Logout',
      'auth.email': 'Email',
      'auth.password': 'Password',
      'auth.forgotPassword': 'Forgot Password?',
      'auth.resetPassword': 'Reset Password',
      'auth.confirmPassword': 'Confirm Password',
      'auth.name': 'Name',
      'auth.phone': 'Phone Number',
      'auth.role': 'Role',
      
      // Dashboard
      'dashboard.title': 'Dashboard',
      'dashboard.totalBalance': 'Total Balance',
      'dashboard.monthlyUsage': 'Monthly Usage',
      'dashboard.activeMeters': 'Active Meters',
      'dashboard.recentPayments': 'Recent Payments',
      'dashboard.yourMeters': 'Your Meters',
      'dashboard.noMeters': 'No meters found. Contact your administrator to add meters to your account.',
      'dashboard.manage': 'Manage',
      'dashboard.noPayments': 'No recent payments found.',
      
      // Meters
      'meters.title': 'Meters',
      'meters.details': 'Meter Details',
      'meters.balance': 'Balance',
      'meters.topUp': 'Top Up',
      'meters.consumption': 'Consumption',
      'meters.status': 'Status',
      'meters.location': 'Location',
      'meters.active': 'Active',
      'meters.inactive': 'Inactive',
      'meters.maintenance': 'Maintenance',
      
      // Payments
      'payments.title': 'Payments',
      'payments.history': 'Payment History',
      'payments.amount': 'Amount',
      'payments.date': 'Date',
      'payments.status': 'Status',
      'payments.method': 'Method',
      'payments.description': 'Description',
      'payments.completed': 'Completed',
      'payments.pending': 'Pending',
      'payments.failed': 'Failed',
      
      // Profile
      'profile.title': 'Profile',
      'profile.edit': 'Edit Profile',
      'profile.changePassword': 'Change Password',
      'profile.currentPassword': 'Current Password',
      'profile.newPassword': 'New Password',
      'profile.confirmNewPassword': 'Confirm New Password',
      'profile.save': 'Save',
      'profile.cancel': 'Cancel',
      
      // Notifications
      'notifications.title': 'Notifications',
      'notifications.markAllRead': 'Mark All as Read',
      'notifications.noNotifications': 'No notifications.',
      
      // Settings
      'settings.title': 'Settings',
      'settings.language': 'Language',
      'settings.theme': 'Theme',
      'settings.darkMode': 'Dark Mode',
      'settings.lightMode': 'Light Mode',
      
      // Errors
      'error.generic': 'An error occurred. Please try again.',
      'error.login': 'Login failed. Check your email and password.',
      'error.register': 'Registration failed. Please try again.',
      'error.network': 'Network error. Check your connection.',
      'error.notFound': 'Page not found.',
      'error.unauthorized': 'Unauthorized. Please login first.',
      
      // Success
      'success.login': 'Successfully logged in!',
      'success.register': 'Successfully registered!',
      'success.passwordReset': 'Password successfully reset!',
      'success.profileUpdate': 'Profile successfully updated!',
      'success.passwordChange': 'Password successfully changed!',
      'success.topUp': 'Top up successful!',
      
      // Validation
      'validation.required': 'Required',
      'validation.email': 'Invalid email',
      'validation.passwordLength': 'Password must be at least 8 characters',
      'validation.passwordMatch': 'Passwords do not match',
      'validation.phoneNumber': 'Invalid phone number',
    },
  },
};

// Add resources to i18n
Object.keys(resources).forEach((lng) => {
  const langResources = resources[lng as keyof typeof resources];
  Object.keys(langResources).forEach((ns) => {
    i18n.addResourceBundle(lng, ns, langResources[ns as keyof typeof langResources]);
  });
});

interface LanguageContextType {
  language: string;
  changeLanguage: (lng: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState(i18n.language || 'id');

  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      setLanguage(lng);
    };

    i18n.on('languageChanged', handleLanguageChanged);

    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, []);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const value = {
    language,
    changeLanguage,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};