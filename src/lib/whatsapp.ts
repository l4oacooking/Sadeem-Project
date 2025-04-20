import { sanitizePhone } from './security';

interface WhatsAppMessage {
  to: string;
  type: 'text' | 'template' | 'media';
  content: string;
  mediaUrl?: string;
  templateName?: string;
  templateData?: Record<string, string>;
}

interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

class WhatsAppService {
  private apiKey: string;
  private apiUrl: string;
  private defaultTemplate: string;

  constructor(apiKey: string, apiUrl: string, defaultTemplate: string) {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
    this.defaultTemplate = defaultTemplate;
  }

  /**
   * Sends a text message via WhatsApp
   */
  async sendTextMessage(to: string, content: string): Promise<WhatsAppResponse> {
    const sanitizedPhone = sanitizePhone(to);
    if (!sanitizedPhone) {
      return {
        success: false,
        error: 'Invalid phone number'
      };
    }

    const message: WhatsAppMessage = {
      to: sanitizedPhone,
      type: 'text',
      content
    };

    return this.sendMessage(message);
  }

  /**
   * Sends a template message via WhatsApp
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    templateData: Record<string, string>
  ): Promise<WhatsAppResponse> {
    const sanitizedPhone = sanitizePhone(to);
    if (!sanitizedPhone) {
      return {
        success: false,
        error: 'Invalid phone number'
      };
    }

    const message: WhatsAppMessage = {
      to: sanitizedPhone,
      type: 'template',
      content: '',
      templateName,
      templateData
    };

    return this.sendMessage(message);
  }

  /**
   * Sends a media message via WhatsApp
   */
  async sendMediaMessage(
    to: string,
    mediaUrl: string,
    caption?: string
  ): Promise<WhatsAppResponse> {
    const sanitizedPhone = sanitizePhone(to);
    if (!sanitizedPhone) {
      return {
        success: false,
        error: 'Invalid phone number'
      };
    }

    const message: WhatsAppMessage = {
      to: sanitizedPhone,
      type: 'media',
      content: caption || '',
      mediaUrl
    };

    return this.sendMessage(message);
  }

  /**
   * Sends a digital product delivery message
   */
  async sendProductDelivery(
    to: string,
    productName: string,
    credentials: {
      username?: string;
      password?: string;
      pin?: string;
      additionalInfo?: string;
    },
    customMessage?: string
  ): Promise<WhatsAppResponse> {
    const sanitizedPhone = sanitizePhone(to);
    if (!sanitizedPhone) {
      return {
        success: false,
        error: 'Invalid phone number'
      };
    }

    // Prepare the message content
    let content = customMessage || this.defaultTemplate;
    content = content.replace('{{productName}}', productName);

    if (credentials.username) {
      content = content.replace('{{username}}', credentials.username);
    }
    if (credentials.password) {
      content = content.replace('{{password}}', credentials.password);
    }
    if (credentials.pin) {
      content = content.replace('{{pin}}', credentials.pin);
    }
    if (credentials.additionalInfo) {
      content = content.replace('{{additionalInfo}}', credentials.additionalInfo);
    }

    // Send the message
    return this.sendTextMessage(sanitizedPhone, content);
  }

  /**
   * Sends a bulk product delivery to multiple customers
   */
  async sendBulkProductDelivery(
    deliveries: Array<{
      to: string;
      productName: string;
      credentials: {
        username?: string;
        password?: string;
        pin?: string;
        additionalInfo?: string;
      };
      customMessage?: string;
    }>
  ): Promise<Array<WhatsAppResponse>> {
    const responses: WhatsAppResponse[] = [];

    for (const delivery of deliveries) {
      const response = await this.sendProductDelivery(
        delivery.to,
        delivery.productName,
        delivery.credentials,
        delivery.customMessage
      );
      responses.push(response);
    }

    return responses;
  }

  /**
   * Internal method to send messages via the WhatsApp API
   */
  private async sendMessage(message: WhatsAppMessage): Promise<WhatsAppResponse> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(message)
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to send message'
        };
      }

      return {
        success: true,
        messageId: data.messageId
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

// Create and export a singleton instance
export const whatsappService = new WhatsAppService(
  process.env.WHATSAPP_API_KEY || '',
  process.env.WHATSAPP_API_URL || '',
  process.env.WHATSAPP_DEFAULT_TEMPLATE || 'Thank you for your purchase! Here are your {{productName}} credentials:\n\nUsername: {{username}}\nPassword: {{password}}\n{{pin}}\n\n{{additionalInfo}}'
); 