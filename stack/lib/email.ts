import { Resend } from "resend";

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY || "");

export interface EmailNotificationParams {
  to: string;
  deviceName?: string;
  eventType: string;
  timestamp: string;
  deviceId: number;
  imageUrl?: string; // Optional image URL for delivery events
}

export async function sendEventNotification({
  to,
  deviceName = "your mailbox",
  eventType,
  timestamp,
  deviceId,
  imageUrl,
}: EmailNotificationParams): Promise<boolean> {
  try {
    // Validate required environment variables
    const apiKey = process.env.RESEND_API_KEY || "";
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    const fromName = process.env.RESEND_FROM_NAME || "Mail Guard";

    if (!apiKey) {
      console.error("Missing required Resend API key");
      return false;
    }

    // Create subject and content based on event type
    const subject = getEmailSubject(eventType);
    const { htmlContent, textContent } = getEmailContent(
      eventType,
      deviceName,
      timestamp,
      deviceId,
      imageUrl
    );

    // Send the email using Resend
    const response = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject: subject,
      html: htmlContent,
      text: textContent,
    });

    console.log("Email sent successfully:", response);
    return true;
  } catch (error) {
    console.error("Error sending email notification:", error);
    return false;
  }
}

function getEmailSubject(eventType: string): string {
  switch (eventType.toLowerCase()) {
    case "delivery":
    case "mail_delivered":
      return "📬 Mail Delivered - Mail Guard Alert";
    case "open":
    case "mailbox_opened":
      return "📭 Mailbox Opened - Mail Guard Alert";
    case "close":
    case "mailbox_closed":
      return "📫 Mailbox Closed - Mail Guard Alert";
    case "removal":
    case "mail_removed":
      return "📮 Mail Removed - Mail Guard Alert";
    case "battery_low":
      return "🔋 Low Battery Alert - Mail Guard";
    default:
      return "📬 Mailbox Alert - Mail Guard";
  }
}

function getEmailContent(
  eventType: string,
  deviceName: string,
  timestamp: string,
  deviceId: number,
  imageUrl?: string
): { htmlContent: string; textContent: string } {
  const eventMessage = getEventMessage(eventType);
  const formattedTime = new Date(timestamp).toLocaleString();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Mail Guard Alert</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">📬 Mail Guard</h1>
        <p style="color: #f0f0f0; margin: 5px 0 0 0; font-size: 14px;">Smart Mailbox Monitoring</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <h2 style="color: #2d3748; margin-top: 0; font-size: 20px;">Mailbox Event Detected</h2>
        
        <div style="background: #f7fafc; border-left: 4px solid #4299e1; padding: 20px; margin: 20px 0; border-radius: 5px;">
          <p style="margin: 0 0 10px 0; font-size: 16px;"><strong>Device:</strong> ${deviceName}</p>
          <p style="margin: 0 0 10px 0; font-size: 16px;"><strong>Event:</strong> ${eventMessage}</p>
          <p style="margin: 0 0 10px 0; font-size: 16px;"><strong>Time:</strong> ${formattedTime}</p>
        </div>
        
        ${
          imageUrl
            ? `
        <div style="text-align: center; margin: 20px 0;">
          <h3 style="color: #2d3748; font-size: 16px; margin-bottom: 10px;">📸 Captured Image</h3>
          <div style="border: 2px solid #e1e5e9; border-radius: 8px; padding: 10px; background: #f9f9f9;">
            <img src="${imageUrl}" alt="Mail delivery photo" style="max-width: 100%; height: auto; border-radius: 4px; display: block; margin: 0 auto;" />
          </div>
          <p style="font-size: 12px; color: #666; margin-top: 5px;">Image captured at the time of delivery</p>
        </div>
        `
            : ""
        }
        
        <p style="color: #4a5568; font-size: 14px; margin: 20px 0;">
          Check your Mail Guard dashboard for more details and recent activity.
        </p>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
          }" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
            View Dashboard
          </a>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
        <p>You're receiving this because you have email notifications enabled for your Mail Guard device.</p>
        <p>© ${new Date().getFullYear()} Mail Guard. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Mail Guard Alert

Device: ${deviceName}
Event: ${eventMessage}
Time: ${formattedTime}
Device ID: #${deviceId}${
    imageUrl
      ? "\n\n📸 A photo was captured during this event. View it in your dashboard."
      : ""
  }

Check your Mail Guard dashboard for more details and recent activity.

Visit: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}

---
You're receiving this because you have email notifications enabled for your Mail Guard device.
© ${new Date().getFullYear()} Mail Guard. All rights reserved.
  `;

  return { htmlContent, textContent };
}

function getEventMessage(eventType: string): string {
  switch (eventType.toLowerCase()) {
    case "delivery":
    case "mail_delivered":
      return "Mail has been delivered";
    case "open":
    case "mailbox_opened":
      return "Mailbox was opened";
    case "close":
    case "mailbox_closed":
      return "Mailbox was closed";
    case "removal":
    case "mail_removed":
      return "Mail was removed";
    case "battery_low":
      return "Battery level is low";
    default:
      return `${eventType} event occurred`;
  }
}

export default {
  sendEventNotification,
};
