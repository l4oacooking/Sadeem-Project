import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { Alert } from './ui/alert';
import { whatsappService } from '../lib/whatsapp';
import { useTranslation } from '../hooks/use-translation';

interface WhatsAppDeliveryProps {
  productName: string;
  credentials: {
    username?: string;
    password?: string;
    pin?: string;
    additionalInfo?: string;
  };
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function WhatsAppDelivery({
  productName,
  credentials,
  onSuccess,
  onError
}: WhatsAppDeliveryProps) {
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await whatsappService.sendProductDelivery(
        phone,
        productName,
        credentials,
        customMessage
      );

      if (response.success) {
        setSuccess(true);
        onSuccess?.();
      } else {
        setError(response.error || t('whatsapp.deliveryError'));
        onError?.(response.error || t('whatsapp.deliveryError'));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('whatsapp.unknownError');
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1">
            {t('whatsapp.phoneNumber')}
          </label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t('whatsapp.phonePlaceholder')}
            required
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-1">
            {t('whatsapp.customMessage')}
          </label>
          <Textarea
            id="message"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder={t('whatsapp.messagePlaceholder')}
            rows={4}
          />
        </div>

        {error && (
          <Alert variant="destructive">
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success">
            {t('whatsapp.deliverySuccess')}
          </Alert>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full"
        >
          {loading ? t('whatsapp.sending') : t('whatsapp.send')}
        </Button>
      </form>
    </Card>
  );
} 