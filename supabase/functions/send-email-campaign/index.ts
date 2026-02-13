import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// SMTP email sending via cPanel
async function sendViaSMTP(config: any, to: string, subject: string, html: string, text?: string) {
  // Use Deno's built-in SMTP capabilities via a lightweight approach
  // We'll use the SMTPClient from deno
  const { SMTPClient } = await import("https://deno.land/x/denomailer@1.6.0/mod.ts");
  
  const client = new SMTPClient({
    connection: {
      hostname: config.host,
      port: config.port || 465,
      tls: config.encryption === 'ssl',
      auth: {
        username: config.username,
        password: config.password,
      },
    },
  });

  await client.send({
    from: config.from_name ? `${config.from_name} <${config.from_email}>` : config.from_email,
    to: to,
    subject: subject,
    content: text || "",
    html: html,
  });

  await client.close();
}

// Send via Resend API
async function sendViaResend(apiKey: string, from: string, to: string, subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Resend API error: ${err}`);
  }
  return await response.json();
}

// Personalize content with merge tags
function personalize(content: string, contact: any): string {
  return content
    .replace(/\{\{first_name\}\}/g, contact.first_name || "")
    .replace(/\{\{last_name\}\}/g, contact.last_name || "")
    .replace(/\{\{email\}\}/g, contact.email || "")
    .replace(/\{\{company\}\}/g, contact.company || "")
    .replace(/\{\{phone\}\}/g, contact.phone || "");
}

// Inject open tracking pixel and wrap links for click tracking
function injectTracking(html: string, campaignId: string, recipientId: string, supabaseUrl: string): string {
  const trackingBase = `${supabaseUrl}/functions/v1/email-tracking`;
  
  // Wrap all <a href="..."> links for click tracking
  let trackedHtml = html.replace(
    /<a\s([^>]*?)href=["']([^"']+)["']([^>]*?)>/gi,
    (_match, before, url, after) => {
      // Skip mailto: and tel: links and already-tracked links
      if (url.startsWith("mailto:") || url.startsWith("tel:") || url.includes("email-tracking")) {
        return `<a ${before}href="${url}"${after}>`;
      }
      const trackedUrl = `${trackingBase}?type=click&cid=${campaignId}&rid=${recipientId}&url=${encodeURIComponent(url)}`;
      return `<a ${before}href="${trackedUrl}"${after}>`;
    }
  );

  // Append open tracking pixel before </body> or at end
  const pixel = `<img src="${trackingBase}?type=open&cid=${campaignId}&rid=${recipientId}" width="1" height="1" style="display:none;border:0;" alt="" />`;
  if (trackedHtml.includes("</body>")) {
    trackedHtml = trackedHtml.replace("</body>", `${pixel}</body>`);
  } else {
    trackedHtml += pixel;
  }

  return trackedHtml;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const trackingEnabled = true;

    // Verify user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const body = await req.json();
    const { action, campaign_id, smtp_config_id, test_email } = body;

    // Get profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (!profile) throw new Error("Profile not found");

    // TEST ACTION - send test email
    if (action === "test") {
      const { data: config } = await supabase
        .from("email_smtp_configs")
        .select("*")
        .eq("id", smtp_config_id)
        .single();
      if (!config) throw new Error("SMTP config not found");

      const testSubject = "Test Email from BiztoriBD";
      const testHtml = `<h2>SMTP Test Successful!</h2><p>Your ${config.provider === 'cpanel' ? 'cPanel SMTP' : 'Resend'} configuration "<strong>${config.name}</strong>" is working correctly.</p><p>From: ${config.from_email}</p>`;

      if (config.provider === "cpanel") {
        await sendViaSMTP(config, test_email, testSubject, testHtml);
      } else {
        await sendViaResend(config.api_key, config.from_email, test_email, testSubject, testHtml);
      }

      return new Response(JSON.stringify({ success: true, message: "Test email sent" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SEND CAMPAIGN
    if (!campaign_id) throw new Error("campaign_id required");

    // Get campaign
    const { data: campaign } = await supabase
      .from("email_campaigns")
      .select("*")
      .eq("id", campaign_id)
      .eq("profile_id", profile.id)
      .single();
    if (!campaign) throw new Error("Campaign not found");
    if (!campaign.list_id) throw new Error("No list assigned to campaign");
    if (!campaign.smtp_config_id) throw new Error("No SMTP config assigned");

    // Get SMTP config
    const { data: config } = await supabase
      .from("email_smtp_configs")
      .select("*")
      .eq("id", campaign.smtp_config_id)
      .single();
    if (!config) throw new Error("SMTP config not found");

    // Get list members with contact info
    const { data: members } = await supabase
      .from("email_list_members")
      .select("contact_id, email_contacts(*)")
      .eq("list_id", campaign.list_id)
      .eq("status", "active");

    if (!members || members.length === 0) throw new Error("No active subscribers in list");

    // Update campaign status
    await supabase.from("email_campaigns").update({
      status: "sending",
      sent_at: new Date().toISOString(),
      total_recipients: members.length,
    }).eq("id", campaign_id);

    let sent = 0;
    let failed = 0;

    // Send to each contact
    for (const member of members) {
      const contact = member.email_contacts as any;
      if (!contact || contact.status !== "subscribed") continue;

      try {
        let personalizedHtml = personalize(campaign.html_content || "", contact);
        const personalizedSubject = personalize(campaign.subject || "No Subject", contact);

        // Create recipient record first to get the ID for tracking
        const { data: recipientRecord } = await supabase.from("email_campaign_recipients").upsert({
          campaign_id,
          contact_id: contact.id,
          status: "sending",
        }, { onConflict: "campaign_id,contact_id" }).select("id").single();

        // Inject tracking pixel and link wrappers
        if (trackingEnabled && recipientRecord) {
          personalizedHtml = injectTracking(personalizedHtml, campaign_id, recipientRecord.id, supabaseUrl);
        }

        if (config.provider === "cpanel") {
          await sendViaSMTP(config, contact.email, personalizedSubject, personalizedHtml, campaign.text_content || undefined);
        } else {
          const fromStr = config.from_name ? `${config.from_name} <${config.from_email}>` : config.from_email;
          await sendViaResend(config.api_key, fromStr, contact.email, personalizedSubject, personalizedHtml);
        }

        // Update recipient status to sent
        await supabase.from("email_campaign_recipients").update({
          status: "sent",
          sent_at: new Date().toISOString(),
        }).eq("id", recipientRecord?.id);

        // Update contact stats
        await supabase.from("email_contacts").update({
          total_emails_sent: (contact.total_emails_sent || 0) + 1,
          last_emailed_at: new Date().toISOString(),
        }).eq("id", contact.id);

        sent++;

        // Rate limiting - wait between sends
        await new Promise(r => setTimeout(r, 200));
      } catch (err) {
        console.error(`Failed to send to ${contact.email}:`, err);
        await supabase.from("email_campaign_recipients").upsert({
          campaign_id,
          contact_id: contact.id,
          status: "failed",
          error_message: err instanceof Error ? err.message : "Unknown error",
        }, { onConflict: "campaign_id,contact_id" });
        failed++;
      }
    }

    // Update campaign final stats
    await supabase.from("email_campaigns").update({
      status: failed === members.length ? "failed" : "sent",
      completed_at: new Date().toISOString(),
      total_sent: sent,
      total_bounces: failed,
    }).eq("id", campaign_id);

    // Update SMTP sent count
    await supabase.from("email_smtp_configs").update({
      emails_sent_today: (config.emails_sent_today || 0) + sent,
    }).eq("id", config.id);

    return new Response(JSON.stringify({ 
      success: true, 
      sent, 
      failed,
      total: members.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Email campaign error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
