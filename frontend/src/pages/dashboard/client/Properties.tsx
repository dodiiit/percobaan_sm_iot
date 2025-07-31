import React from 'react';
import { useTranslation } from 'react-i18next';

const PlaceholderComponent: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Page Under Development
      </h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600">This page is under development.</p>
      </div>
    </div>
  );
};

export default PlaceholderComponent;
