import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { whatsAppService } from '../services/whatsAppService';

interface WhatsAppDeliveryFormProps {
  productName: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const WhatsAppDeliveryForm: React.FC<WhatsAppDeliveryFormProps> = ({
  productName,
  onSuccess,
  onError,
}) => {
  const { t } = useTranslation('whatsapp');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // In a real application, these credentials should be stored securely
      // and retrieved from a secure configuration or environment variables
      const credentials = {
        apiKey: process.env.REACT_APP_WHATSAPP_API_KEY || '',
        phoneNumberId: process.env.REACT_APP_WHATSAPP_PHONE_NUMBER_ID || '',
        businessAccountId: process.env.REACT_APP_WHATSAPP_BUSINESS_ACCOUNT_ID || '',
      };

      await whatsAppService.sendProductDelivery({
        to: phoneNumber,
        productName,
        customMessage,
        credentials,
      });

      onSuccess?.();
    } catch (error) {
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
          {t('phoneNumber')}
        </label>
        <input
          type="tel"
          id="phoneNumber"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder={t('phonePlaceholder')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="customMessage" className="block text-sm font-medium text-gray-700">
          {t('customMessage')}
        </label>
        <textarea
          id="customMessage"
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          placeholder={t('messagePlaceholder')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          rows={3}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {isLoading ? t('sending') : t('send')}
      </button>
    </form>
  );
}; 