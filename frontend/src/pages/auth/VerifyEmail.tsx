import React from 'react';
import { useTranslation } from 'react-i18next';

const VerifyEmail: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('auth.verifyEmail.title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('auth.verifyEmail.subtitle')}
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <button
            type="button"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {t('auth.verifyEmail.resendButton')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;