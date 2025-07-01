import { WhatsAppCloudApiClient } from './whatsapp-client';

/**
 * Singleton service to manage WhatsApp client instances
 */
export class WhatsAppClientService {
    private static instance: WhatsAppClientService;
    private client: WhatsAppCloudApiClient | null = null;
    private accessToken: string | null = null;
    private phoneNumberId: string | null = null;

    private constructor() { }

    public static getInstance(): WhatsAppClientService {
        if (!WhatsAppClientService.instance) {
            WhatsAppClientService.instance = new WhatsAppClientService();
        }
        return WhatsAppClientService.instance;
    }

    public getClient(accessToken?: string, phoneNumberId?: string): WhatsAppCloudApiClient {
        // If no client exists or if credentials have changed, create a new client
        if (!this.client ||
            (accessToken && accessToken !== this.accessToken) ||
            (phoneNumberId && phoneNumberId !== this.phoneNumberId)) {

            // Use provided parameters or fall back to environment configuration
            const envAccessToken = process.env.WHATSAPP_ACCESS_TOKEN;
            const envPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

            const finalAccessToken = accessToken || this.accessToken || envAccessToken;
            const finalPhoneNumberId = phoneNumberId || this.phoneNumberId || envPhoneNumberId;

            if (!finalAccessToken) {
                throw new Error('Missing WhatsApp access token');
            }

            this.client = new WhatsAppCloudApiClient({
                accessToken: finalAccessToken,
                phoneNumberId: finalPhoneNumberId || undefined
            });

            this.accessToken = finalAccessToken;
            this.phoneNumberId = finalPhoneNumberId || null;
        }

        return this.client;
    }

    public updateConfig(accessToken?: string, phoneNumberId?: string): void {
        if (accessToken) this.accessToken = accessToken;
        if (phoneNumberId) this.phoneNumberId = phoneNumberId;

        // Clear existing client so it will be recreated with new config
        this.client = null;
    }
} 