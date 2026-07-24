import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "BeforeSpend Notifications <notifications@beforespend.xyz>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailPayload {
  to: string;
  type: "login_alert" | "low_balance" | "reminder" | "welcome" | "password_reset" | "income_alert" | "monthly_summary";
  userName?: string;
  data?: Record<string, any>;
}

// Brand Header Layout: Uses official website logo image (white variant) & center-aligned tagline
const BRAND_HEADER_HTML = `
  <div style="background: linear-gradient(135deg, #0E2A47 0%, #061626 100%); padding: 36px 24px; text-align: center; border-radius: 16px 16px 0 0;">
    <div style="text-align: center; margin-bottom: 8px;">
      <img src="https://beforespend.xyz/logo.png" alt="BeforeSpend" style="height: 46px; width: auto; display: inline-block; filter: brightness(0) invert(1);" />
    </div>
    <div style="color: #00A896; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; text-align: center; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">PLAN. ALLOCATE. PROTECT.</div>
  </div>
`;

// Brand Footer Layout: Center-aligned legal & support navigation
const BRAND_FOOTER_HTML = `
  <div style="background-color: #F8FAFC; padding: 28px 24px; border-top: 1px solid #E2E8F0; text-align: center; border-radius: 0 0 16px 16px; font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;">
    <p style="color: #64748B; font-size: 12px; line-height: 1.6; margin: 0 0 12px 0; text-align: center;">
      This is an automated security & account notification from <strong>BeforeSpend</strong>. Please do not reply directly to this email.
    </p>
    <p style="color: #0E2A47; font-size: 12px; font-weight: 700; margin: 0 0 12px 0; text-align: center;">
      BeforeSpend &bull; <a href="https://beforespend.xyz" style="color: #00A896; text-decoration: none;">beforespend.xyz</a>
    </p>
    <div style="font-size: 11px; color: #94A3B8; text-align: center;">
      <a href="mailto:support@beforespend.xyz" style="color: #00A896; text-decoration: none; font-weight: 600;">Contact Support</a> &nbsp;|&nbsp; 
      <a href="https://beforespend.xyz/privacy" style="color: #94A3B8; text-decoration: none;">Privacy Policy</a> &nbsp;|&nbsp; 
      <a href="https://beforespend.xyz/terms" style="color: #94A3B8; text-decoration: none;">Terms of Service</a>
    </div>
  </div>
`;

// Reliable Bulletproof Badge Icon (Renderable in Gmail, Outlook, Apple Mail)
function renderCategoryBadge(color: string, label: string): string {
  return `
    <div style="display: inline-block; width: 56px; height: 56px; background-color: ${color}; border-radius: 16px; margin: 0 auto 16px auto; text-align: center; line-height: 56px;">
      <span style="color: #ffffff; font-size: 22px; font-weight: 900; font-family: sans-serif;">${label}</span>
    </div>
  `;
}

function getEmailTemplate(payload: EmailPayload): { subject: string; html: string } {
  const { type, userName = "Valued User", data = {} } = payload;

  switch (type) {
    case "login_alert": {
      const { ip = "Unknown IP", device = "Web Browser", timestamp = new Date().toUTCString(), location = "Active Session" } = data;
      return {
        subject: `Security Alert: New sign-in detected on your BeforeSpend account`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #E2E8F0; border-radius: 16px; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center;">
            ${BRAND_HEADER_HTML}
            
            <div style="padding: 36px 32px; text-align: center; color: #0E2A47;">
              ${renderCategoryBadge("#0E2A47", "S")}

              <h2 style="font-size: 22px; font-weight: 800; color: #0E2A47; margin: 0 0 12px 0; text-align: center;">New Account Sign-in</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 16px 0; text-align: center;">Hello <strong>${userName}</strong>,</p>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0; text-align: center;">We recorded a new successful authentication session for your BeforeSpend account:</p>
              
              <!-- Details Box -->
              <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-left: 4px solid #00A896; border-radius: 12px; padding: 20px; margin: 0 auto 24px auto; text-align: center;">
                <table align="center" style="margin: 0 auto; border-collapse: collapse; font-size: 13px; color: #334155; text-align: left;">
                  <tr><td style="padding: 6px 12px; font-weight: 700; color: #64748B;">Device / Browser:</td><td style="padding: 6px 12px; font-weight: 700; color: #0E2A47;">${device}</td></tr>
                  <tr><td style="padding: 6px 12px; font-weight: 700; color: #64748B;">IP Address:</td><td style="padding: 6px 12px; font-family: monospace; font-weight: 700; color: #0E2A47;">${ip}</td></tr>
                  <tr><td style="padding: 6px 12px; font-weight: 700; color: #64748B;">Session Location:</td><td style="padding: 6px 12px; font-weight: 700; color: #0E2A47;">${location}</td></tr>
                  <tr><td style="padding: 6px 12px; font-weight: 700; color: #64748B;">Timestamp:</td><td style="padding: 6px 12px; font-weight: 700; color: #0E2A47;">${timestamp}</td></tr>
                </table>
              </div>

              <p style="font-size: 13px; color: #64748B; line-height: 1.6; margin: 0 0 28px 0; text-align: center;">If this sign-in was initiated by you, no action is required. If you did not perform this login, please update your password immediately.</p>

              <div style="text-align: center;">
                <a href="https://beforespend.xyz/dashboard" style="background-color: #0E2A47; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 800; font-size: 14px; display: inline-block; text-align: center;">Go to Dashboard</a>
              </div>
            </div>
            ${BRAND_FOOTER_HTML}
          </div>
        `,
      };
    }

    case "low_balance": {
      const { bucketName = "Budget Bucket", currentBalance = "₦0.00", threshold = "₦0.00" } = data;
      return {
        subject: `Low Balance Alert: ${bucketName} balance is below limit`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #E2E8F0; border-radius: 16px; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center;">
            ${BRAND_HEADER_HTML}
            
            <div style="padding: 36px 32px; text-align: center; color: #0E2A47;">
              ${renderCategoryBadge("#DC2626", "!")}

              <h2 style="font-size: 22px; font-weight: 800; color: #0E2A47; margin: 0 0 12px 0; text-align: center;">Low Bucket Balance Warning</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 16px 0; text-align: center;">Hello <strong>${userName}</strong>,</p>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0; text-align: center;">Your budget allocation bucket <strong>${bucketName}</strong> has dropped below your set threshold limit.</p>

              <!-- Metric Highlight Box -->
              <div style="background-color: #FEF2F2; border: 1px solid #FCA5A5; border-radius: 14px; padding: 24px; text-align: center; margin: 0 auto 24px auto;">
                <div style="font-size: 11px; font-weight: 700; color: #991B1B; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; text-align: center;">Current Available Balance</div>
                <div style="font-size: 34px; font-weight: 900; color: #DC2626; margin-bottom: 8px; text-align: center;">${currentBalance}</div>
                <div style="font-size: 12px; color: #7F1D1D; font-weight: 600; text-align: center;">Configured Low Threshold: <strong>${threshold}</strong></div>
              </div>

              <p style="font-size: 13px; color: #64748B; line-height: 1.6; margin: 0 0 28px 0; text-align: center;">You can route a new deposit into this bucket using the Income Splitter.</p>

              <div style="text-align: center;">
                <a href="https://beforespend.xyz/dashboard" style="background-color: #00A896; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 800; font-size: 14px; display: inline-block; text-align: center;">Re-allocate Funds Now</a>
              </div>
            </div>
            ${BRAND_FOOTER_HTML}
          </div>
        `,
      };
    }

    case "income_alert": {
      const { amount = "₦0.00", splitCount = 0, date = new Date().toLocaleDateString(), splits = [] } = data;
      const splitRows = Array.isArray(splits)
        ? splits.map((s: any) => `<tr><td style="padding: 6px 12px; font-weight: 700; color: #0E2A47;">${s.bucketName}</td><td style="padding: 6px 12px; font-weight: 800; color: #00A896; text-align: right;">${s.amount}</td></tr>`).join('')
        : '';

      return {
        subject: `Income Allocation Deposit Received: ${amount}`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #E2E8F0; border-radius: 16px; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center;">
            ${BRAND_HEADER_HTML}
            
            <div style="padding: 36px 32px; text-align: center; color: #0E2A47;">
              ${renderCategoryBadge("#00A896", "+")}

              <h2 style="font-size: 22px; font-weight: 800; color: #0E2A47; margin: 0 0 12px 0; text-align: center;">Income Split Allocated</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 16px 0; text-align: center;">Hello <strong>${userName}</strong>,</p>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0; text-align: center;">A new income deposit of <strong>${amount}</strong> was split across ${splitCount} budget buckets on ${date}.</p>

              <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin: 0 auto 24px auto;">
                <table align="center" style="width: 100%; margin: 0 auto; border-collapse: collapse; font-size: 13px; text-align: left;">
                  ${splitRows}
                </table>
              </div>

              <div style="text-align: center;">
                <a href="https://beforespend.xyz/dashboard" style="background-color: #0E2A47; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 800; font-size: 14px; display: inline-block; text-align: center;">View Dashboard Ledger</a>
              </div>
            </div>
            ${BRAND_FOOTER_HTML}
          </div>
        `,
      };
    }

    case "reminder": {
      const { reminderText = "Scheduled Bill", cost = "Scheduled Amount", dueDate = "Today", period = "monthly" } = data;
      return {
        subject: `Bill Reminder: ${reminderText} is due soon`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #E2E8F0; border-radius: 16px; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center;">
            ${BRAND_HEADER_HTML}
            
            <div style="padding: 36px 32px; text-align: center; color: #0E2A47;">
              ${renderCategoryBadge("#00A896", "R")}

              <h2 style="font-size: 22px; font-weight: 800; color: #0E2A47; margin: 0 0 12px 0; text-align: center;">Bill & Subscription Reminder</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 16px 0; text-align: center;">Hello <strong>${userName}</strong>,</p>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0; text-align: center;">This is a scheduled reminder for your upcoming recurring bill or subscription:</p>

              <!-- Bill Card -->
              <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 24px; margin: 0 auto 24px auto; text-align: center;">
                <h3 style="font-size: 18px; font-weight: 800; color: #0E2A47; margin: 0 0 14px 0; text-align: center;">${reminderText}</h3>
                <table align="center" style="margin: 0 auto; border-collapse: collapse; font-size: 13px; color: #334155; text-align: left;">
                  <tr><td style="padding: 6px 12px; font-weight: 600; color: #64748B;">Scheduled Amount:</td><td style="padding: 6px 12px; font-weight: 800; color: #00A896; font-size: 15px;">${cost}</td></tr>
                  <tr><td style="padding: 6px 12px; font-weight: 600; color: #64748B;">Due Date:</td><td style="padding: 6px 12px; font-weight: 700; color: #0E2A47;">${dueDate}</td></tr>
                  <tr><td style="padding: 6px 12px; font-weight: 600; color: #64748B;">Frequency:</td><td style="padding: 6px 12px; font-weight: 600; color: #475569; text-transform: capitalize;">${period}</td></tr>
                </table>
              </div>

              <div style="text-align: center;">
                <a href="https://beforespend.xyz/dashboard" style="background-color: #0E2A47; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 800; font-size: 14px; display: inline-block; text-align: center;">Review Reminders</a>
              </div>
            </div>
            ${BRAND_FOOTER_HTML}
          </div>
        `,
      };
    }

    case "welcome": {
      return {
        subject: `Welcome to BeforeSpend - Master your financial future`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #E2E8F0; border-radius: 16px; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center;">
            ${BRAND_HEADER_HTML}
            
            <div style="padding: 36px 32px; text-align: center; color: #0E2A47;">
              ${renderCategoryBadge("#00A896", "W")}

              <h2 style="font-size: 22px; font-weight: 800; color: #0E2A47; margin: 0 0 12px 0; text-align: center;">Welcome to BeforeSpend, ${userName}!</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 16px 0; text-align: center;">Your workspace is ready. BeforeSpend enables you to split and assign every income deposit into custom budget buckets <em>before</em> any spending occurs.</p>
              
              <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 24px; margin: 0 auto 24px auto; text-align: center;">
                <h4 style="color: #0E2A47; font-size: 15px; font-weight: 800; margin: 0 0 12px 0; text-align: center;">The BeforeSpend Framework:</h4>
                <p style="color: #334155; font-size: 13px; line-height: 1.8; margin: 0; text-align: center;">
                  <strong>Plan:</strong> Set target percentages for Needs, Savings, Investments, and Wants.<br />
                  <strong>Allocate:</strong> Split incoming salary & freelance deposits automatically.<br />
                  <strong>Protect:</strong> Monitor low-balance alert thresholds and recurring bill dues.
                </p>
              </div>

              <div style="text-align: center;">
                <a href="https://beforespend.xyz/dashboard" style="background-color: #00A896; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 800; font-size: 15px; display: inline-block; text-align: center;">Launch My Workspace</a>
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
        subject: `Password Reset Request for your BeforeSpend account`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #E2E8F0; border-radius: 16px; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center;">
            ${BRAND_HEADER_HTML}
            
            <div style="padding: 36px 32px; text-align: center; color: #0E2A47;">
              ${renderCategoryBadge("#0E2A47", "K")}

              <h2 style="font-size: 22px; font-weight: 800; color: #0E2A47; margin: 0 0 12px 0; text-align: center;">Reset Your Password</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 16px 0; text-align: center;">Hello <strong>${userName}</strong>,</p>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0; text-align: center;">We received a request to update the password for your BeforeSpend account. Click the button below to set a new password:</p>

              <div style="text-align: center; margin: 0 auto 28px auto;">
                <a href="${resetUrl}" style="background-color: #0E2A47; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 800; font-size: 15px; display: inline-block; text-align: center;">Set New Password</a>
              </div>

              <p style="font-size: 12px; color: #94A3B8; line-height: 1.5; margin: 0; text-align: center;">If you did not initiate this request, you can safely disregard this email. Your password will remain unchanged.</p>
            </div>
            ${BRAND_FOOTER_HTML}
          </div>
        `,
      };
    }

    case "monthly_summary": {
      const { month = "Current Month", totalAllocated = "₦0.00", totalSpent = "₦0.00", netSavings = "₦0.00" } = data;
      return {
        subject: `Monthly Financial Summary: ${month}`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #E2E8F0; border-radius: 16px; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center;">
            ${BRAND_HEADER_HTML}
            
            <div style="padding: 36px 32px; text-align: center; color: #0E2A47;">
              ${renderCategoryBadge("#00A896", "M")}

              <h2 style="font-size: 22px; font-weight: 800; color: #0E2A47; margin: 0 0 12px 0; text-align: center;">Monthly Financial Digest (${month})</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0; text-align: center;">Here is your account progress summary for ${month}:</p>

              <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 24px; margin: 0 auto 24px auto;">
                <table align="center" style="margin: 0 auto; border-collapse: collapse; font-size: 13px; text-align: left; width: 100%;">
                  <tr><td style="padding: 8px 12px; font-weight: 600; color: #64748B;">Total Income Allocated:</td><td style="padding: 8px 12px; font-weight: 800; color: #00A896; text-align: right;">${totalAllocated}</td></tr>
                  <tr><td style="padding: 8px 12px; font-weight: 600; color: #64748B;">Total Expenses Logged:</td><td style="padding: 8px 12px; font-weight: 800; color: #DC2626; text-align: right;">${totalSpent}</td></tr>
                  <tr><td style="padding: 8px 12px; font-weight: 600; color: #64748B;">Net Reserve Balance:</td><td style="padding: 8px 12px; font-weight: 800; color: #0E2A47; text-align: right;">${netSavings}</td></tr>
                </table>
              </div>

              <div style="text-align: center;">
                <a href="https://beforespend.xyz/dashboard" style="background-color: #0E2A47; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 800; font-size: 15px; display: inline-block; text-align: center;">View Insights Dashboard</a>
              </div>
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
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #E2E8F0; border-radius: 16px; font-family: Inter, sans-serif; text-align: center;">
            ${BRAND_HEADER_HTML}
            <div style="padding: 32px 28px; text-align: center;">
              <p style="color: #0E2A47; font-size: 14px; text-align: center;">Hello ${userName},</p>
              <p style="color: #475569; font-size: 14px; text-align: center;">${data.message || "You have a new update in your BeforeSpend workspace."}</p>
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
