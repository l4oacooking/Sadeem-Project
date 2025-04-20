import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { sendDeliveryNotification } from '../../services/whatsappService';
import './WhatsAppNotification.css';

interface WhatsAppNotificationProps {
  productName: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const WhatsAppNotification: React.FC<WhatsAppNotificationProps> = ({
  productName,
  onSuccess,
  onError,
}) => {
  const { t } = useTranslation('whatsapp');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await sendDeliveryNotification({
        phoneNumber,
        productName,
        customMessage,
      });
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('error');
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="whatsapp-notification">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="phoneNumber">{t('phoneNumber')}</label>
          <input
            type="tel"
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder={t('phonePlaceholder')}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="customMessage">{t('customMessage')}</label>
          <textarea
            id="customMessage"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder={t('messagePlaceholder')}
            rows={3}
          />
        </div>

        {error && <div className="error-message">{t('error')}</div>}

        <button
          type="submit"
          className="send-button"
          disabled={isLoading}
        >
          {isLoading ? t('sending') : t('send')}
        </button>
      </form>
    </div>
  );
}; 