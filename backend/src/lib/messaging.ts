import { EmailClient } from "@azure/communication-email";
import "dotenv/config";

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

const connectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING || "";
const senderAddress = process.env.AZURE_COMMUNICATION_SENDER_ADDRESS || "donotreply@yourdomain.azurecomm.net";

let emailClient: EmailClient | null = null;
if (connectionString) {
  emailClient = new EmailClient(connectionString);
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  senderName?: string
): Promise<EmailResponse> {
  if (!connectionString || !emailClient) {
    console.log(`[ACS Bypass] Email to: ${to}\nSubject: ${subject}\nBody preview: ${html.substring(0, 150)}...`);
    return { success: true, messageId: "local-bypass-msg-id" };
  }

  try {
    const message = {
      senderAddress: senderAddress,
      content: {
        subject: subject,
        html: html,
      },
      recipients: {
        to: [
          {
            address: to,
            displayName: senderName || "Receiver",
          },
        ],
      },
    };

    const poller = await emailClient.beginSend(message);
    const response = await poller.pollUntilDone();
    return { success: true, messageId: response.id };
  } catch (error: any) {
    console.error("ACS Email Error:", error);
    return { success: false, error: error.message };
  }
}
