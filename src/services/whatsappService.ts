import axios from 'axios';

const WHATSAPP_API_URL = process.env.REACT_APP_WHATSAPP_API_URL;
const WHATSAPP_API_KEY = process.env.REACT_APP_WHATSAPP_API_KEY;

interface WhatsAppMessage {
  phoneNumber: string;
  productName: string;
  customMessage?: string;
}

export const sendDeliveryNotification = async ({
  phoneNumber,
  productName,
  customMessage,
}: WhatsAppMessage): Promise<void> => {
  try {
    if (!WHATSAPP_API_URL || !WHATSAPP_API_KEY) {
      throw new Error('WhatsApp API configuration is missing');
    }

    const response = await axios.post(
      WHATSAPP_API_URL,
      {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'template',
        template: {
          name: 'product_delivery',
          language: {
            code: 'en',
          },
          components: [
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: productName,
                },
                {
                  type: 'text',
                  text: customMessage || 'Your product has been delivered!',
                },
              ],
            },
          ],
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status !== 200) {
      throw new Error('Failed to send WhatsApp notification');
    }
  } catch (error) {
    console.error('WhatsApp API Error:', error);
    throw error;
  }
}; 