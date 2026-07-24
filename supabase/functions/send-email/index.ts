import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "BeforeSpend <onboarding@resend.dev>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailPayload {
  to: string;
  type: "login_alert" | "low_balance" | "reminder" | "welcome" | "password_reset" | "monthly_summary";
  userName?: string;
  data?: Record<string, any>;
}

// Inline Brand Header SVG Logo HTML
const BRAND_HEADER_HTML = `
  <div style="background-color: #0E2A47; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
    <div style="display: inline-flex; align-items: center; gap: 10px;">
      <div style="width: 36px; height: 36px; background-color: #00A896; border-radius: 10px; display: inline-block; text-align: center; line-height: 36px;">
        <span style="color: #ffffff; font-weight: 900; font-size: 20px; font-family: sans-serif;">B</span>
      </div>
      <span style="color: #ffffff; font-size: 22px; font-weight: 800; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; letter-spacing: -0.5px;">Before<span style="color: #00A896;">Spend</span></span>
    </div>
    <p style="color: #94A3B8; font-size: 12px; margin-top: 6px; font-family: sans-serif; margin-bottom: 0;">Master Your Income Before You Spend</p>
  </div>
`;

// Standard Brand Footer HTML
const BRAND_FOOTER_HTML = `
  <div style="background-color: #F8FAFC; padding: 20px; border-top: 1px solid #E2E8F0; text-align: center; border-radius: 0 0 12px 12px; font-family: sans-serif;">
    <p style="color: #64748B; font-size: 12px; margin: 0 0 8px 0;">
      This email was sent by <strong>BeforeSpend Inc.</strong> &bull; <a href="https://beforespend.xyz" style="color: #00A896; text-decoration: none;">beforespend.xyz</a>
    </p>
    <p style="color: #94A3B8; font-size: 11px; margin: 0;">
      Need help? Contact <a href="mailto:support@beforespend.xyz" style="color: #00A896;">support@beforespend.xyz</a> | <a href="https://beforespend.xyz/privacy" style="color: #94A3B8;">Privacy Policy</a>
    </p>
  </div>
`;

function getEmailTemplate(payload: EmailPayload): { subject: string; html: string } {
  const { type, userName = "Valued User", data = {} } = payload;

  switch (type) {
    case "login_alert": {
      const { ip = "Unknown IP", device = "Web Browser", timestamp = new Date().toUTCString(), location = "Unknown Location" } = data;
      return {
        subject: `🔒 Security Alert: New Login to your BeforeSpend Account`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #E2E8F0; border-radius: 12px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
            ${BRAND_HEADER_HTML}
            <div style="padding: 32px 28px; color: #1E293B;">
              <h2 style="font-size: 20px; font-weight: 700; color: #0E2A47; margin-top: 0;">New Account Login Detected</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569;">Hello <strong>${userName}</strong>,</p>
              <p style="font-size: 14px; line-height: 1.6; color: #475569;">We noticed a recent sign-in to your BeforeSpend personal finance account. Here are the details:</p>
              
              <div style="background-color: #F1F5F9; border-left: 4px solid #00A896; padding: 16px; border-radius: 6px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155;">
                  <tr><td style="padding: 4px 0; font-weight: bold; width: 120px;">Device / Browser:</td><td>${device}</td></tr>
                  <tr><td style="padding: 4px 0; font-weight: bold;">IP Address:</td><td style="font-family: monospace;">${ip}</td></tr>
                  <tr><td style="padding: 4px 0; font-weight: bold;">Location:</td><td>${location}</td></tr>
                  <tr><td style="padding: 4px 0; font-weight: bold;">Timestamp:</td><td>${timestamp}</td></tr>
                </table>
              </div>

              <p style="font-size: 13px; color: #64748B; line-height: 1.5;">If this was you, no action is needed. If you did not log in at this time, please change your password immediately in your account settings.</p>

              <div style="text-align: center; margin-top: 28px;">
                <a href="https://beforespend.xyz/dashboard" style="background-color: #0E2A47; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">Go to My Dashboard</a>
              </div>
            </div>
            ${BRAND_FOOTER_HTML}
          </div>
        `,
      };
    }

    case "low_balance": {
      const { bucketName = "Budget Bucket", currentBalance = "₦0.00", threshold = "₦0.00", currency = "NGN" } = data;
      return {
        subject: `⚠️ Low Balance Warning: ${bucketName} has dropped below limit`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #E2E8F0; border-radius: 12px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
            ${BRAND_HEADER_HTML}
            <div style="padding: 32px 28px; color: #1E293B;">
              <h2 style="font-size: 20px; font-weight: 700; color: #DC2626; margin-top: 0;">⚠️ Low Bucket Balance Alert</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569;">Hello <strong>${userName}</strong>,</p>
              <p style="font-size: 14px; line-height: 1.6; color: #475569;">Your budget allocation bucket <strong>${bucketName}</strong> has reached your configured low balance notification limit.</p>
              
              <div style="background-color: #FEF2F2; border: 1px solid #FCA5A5; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
                <p style="font-size: 12px; color: #991B1B; font-weight: 700; text-transform: uppercase; margin: 0 0 6px 0;">Current Available Balance</p>
                <p style="font-size: 32px; font-weight: 900; color: #DC2626; margin: 0;">${currentBalance}</p>
                <p style="font-size: 12px; color: #7F1D1D; margin: 8px 0 0 0;">Configured Low Threshold: <strong>${threshold}</strong></p>
              </div>

              <p style="font-size: 13px; color: #64748B;">You can log a new income deposit to re-allocate funds into this bucket or adjust your threshold settings.</p>

              <div style="text-align: center; margin-top: 28px;">
                <a href="https://beforespend.xyz/dashboard" style="background-color: #00A896; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">Re-allocate Funds Now</a>
              </div>
            </div>
            ${BRAND_FOOTER_HTML}
          </div>
        `,
      };
    }

    case "reminder": {
      const { reminderText = "Upcoming Subscription", cost = "₦0.00", dueDate = "Today", period = "monthly" } = data;
      return {
        subject: `🔔 Reminder: ${reminderText} is due soon (${cost})`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #E2E8F0; border-radius: 12px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
            ${BRAND_HEADER_HTML}
            <div style="padding: 32px 28px; color: #1E293B;">
              <h2 style="font-size: 20px; font-weight: 700; color: #0E2A47; margin-top: 0;">Upcoming Bill / Subscription Reminder</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569;">Hello <strong>${userName}</strong>,</p>
              <p style="font-size: 14px; line-height: 1.6; color: #475569;">This is a quick notification from BeforeSpend to ensure you don't miss an upcoming recurring bill deduction:</p>

              <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 20px; margin: 20px 0;">
                <h3 style="font-size: 16px; font-weight: 800; color: #0E2A47; margin: 0 0 10px 0;">${reminderText}</h3>
                <div style="display: flex; justify-content: space-between; font-size: 14px; color: #334155; margin-bottom: 6px;">
                  <span>Scheduled Amount:</span>
                  <strong style="color: #00A896;">${cost}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 14px; color: #334155; margin-bottom: 6px;">
                  <span>Due Date:</span>
                  <strong>${dueDate}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 14px; color: #334155;">
                  <span>Frequency:</span>
                  <span style="text-transform: capitalize;">${period}</span>
                </div>
              </div>

              <div style="text-align: center; margin-top: 28px;">
                <a href="https://beforespend.xyz/dashboard" style="background-color: #0E2A47; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">View All Reminders</a>
              </div>
            </div>
            ${BRAND_FOOTER_HTML}
          </div>
        `,
      };
    }

    case "welcome": {
      return {
        subject: `🎉 Welcome to BeforeSpend - Master Your Financial Future`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #E2E8F0; border-radius: 12px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
            ${BRAND_HEADER_HTML}
            <div style="padding: 32px 28px; color: #1E293B;">
              <h2 style="font-size: 20px; font-weight: 700; color: #0E2A47; margin-top: 0;">Welcome aboard, ${userName}! 👋</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569;">We're thrilled to have you on BeforeSpend. Our mission is simple: help you split and assign every naira or dollar of income into custom budget buckets <em>before</em> you spend it.</p>
              
              <div style="background-color: #F0FDF4; border: 1px solid #BBF7D0; padding: 18px; border-radius: 10px; margin: 20px 0;">
                <h4 style="color: #166534; font-size: 14px; font-weight: 800; margin: 0 0 8px 0;">Quick Setup Steps:</h4>
                <ul style="margin: 0; padding-left: 20px; color: #15803D; font-size: 13px; line-height: 1.6;">
                  <li>Customize your <strong>Allocation Buckets</strong> (Needs, Savings, Investments, Wants).</li>
                  <li>Log income deposits into the <strong>Split Calculator</strong>.</li>
                  <li>Import your <strong>Bank Statements</strong> for automatic PDF transaction parsing.</li>
                </ul>
              </div>

              <div style="text-align: center; margin-top: 28px;">
                <a href="https://beforespend.xyz/dashboard" style="background-color: #00A896; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 800; font-size: 15px; display: inline-block;">Launch My Workspace</a>
              </div>
            </div>
            ${BRAND_FOOTER_HTML}
          </div>
        `,
      };
    }

    case "password_reset": {
      const { resetUrl = "https://beforespend.xyz/login" } = data;
      return {
        subject: `🔐 Reset Your BeforeSpend Password`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #E2E8F0; border-radius: 12px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
            ${BRAND_HEADER_HTML}
            <div style="padding: 32px 28px; color: #1E293B;">
              <h2 style="font-size: 20px; font-weight: 700; color: #0E2A47; margin-top: 0;">Password Reset Request</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569;">Hello <strong>${userName}</strong>,</p>
              <p style="font-size: 14px; line-height: 1.6; color: #475569;">We received a request to reset the password for your BeforeSpend account. Click the button below to set a new password:</p>

              <div style="text-align: center; margin: 28px 0;">
                <a href="${resetUrl}" style="background-color: #0E2A47; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 800; font-size: 15px; display: inline-block;">Reset Password</a>
              </div>

              <p style="font-size: 12px; color: #94A3B8;">If you did not request a password reset, please ignore this email or contact security support.</p>
            </div>
            ${BRAND_FOOTER_HTML}
          </div>
        `,
      };
    }

    default: {
      return {
        subject: `Notification from BeforeSpend`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #E2E8F0; border-radius: 12px; font-family: sans-serif;">
            ${BRAND_HEADER_HTML}
            <div style="padding: 32px 28px;">
              <p>Hello ${userName},</p>
              <p>${data.message || "You have a new update in your BeforeSpend account."}</p>
            </div>
            ${BRAND_FOOTER_HTML}
          </div>
        `,
      };
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload: EmailPayload = await req.json();

    if (!payload.to) {
      return new Response(JSON.stringify({ error: "Missing recipient email address ('to')" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { subject, html } = getEmailTemplate(payload);

    if (RESEND_API_KEY) {
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [payload.to],
          subject,
          html,
        }),
      });

      const resendData = await resendRes.json();
      if (!resendRes.ok) {
        console.warn("Resend API error:", resendData);
        return new Response(JSON.stringify({ success: false, provider: "resend", error: resendData }), {
          status: resendRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, provider: "resend", data: resendData }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      // Fallback response for unconfigured email provider
      console.log(`[Email Simulation] To: ${payload.to} | Subject: ${subject}`);
      return new Response(
        JSON.stringify({
          success: true,
          simulated: true,
          message: "Email generated successfully. Configure RESEND_API_KEY in Supabase secrets to send live emails.",
          subject,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Failed to process email request" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
