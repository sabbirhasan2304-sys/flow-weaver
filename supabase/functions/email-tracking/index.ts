import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 1x1 transparent GIF pixel
const TRACKING_PIXEL = Uint8Array.from(atob("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"), c => c.charCodeAt(0));

serve(async (req) => {
  const url = new URL(req.url);
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const recipientId = url.searchParams.get("rid");
  const campaignId = url.searchParams.get("cid");

  // OPEN TRACKING: GET /email-tracking?type=open&rid=...&cid=...
  if (url.searchParams.get("type") === "open") {
    if (recipientId && campaignId) {
      try {
        // Update recipient record
        const { data: recipient } = await supabase
          .from("email_campaign_recipients")
          .select("open_count")
          .eq("id", recipientId)
          .single();

        const openCount = (recipient?.open_count || 0) + 1;
        const updateData: Record<string, unknown> = { open_count: openCount };
        if (openCount === 1) updateData.opened_at = new Date().toISOString();

        await supabase
          .from("email_campaign_recipients")
          .update(updateData)
          .eq("id", recipientId);

        // Update campaign total opens
        await supabase.rpc("increment_campaign_opens", { p_campaign_id: campaignId });

        // Update contact total opens
        const { data: recData } = await supabase
          .from("email_campaign_recipients")
          .select("contact_id")
          .eq("id", recipientId)
          .single();
        if (recData) {
          const { data: contact } = await supabase
            .from("email_contacts")
            .select("total_opens")
            .eq("id", recData.contact_id)
            .single();
          await supabase
            .from("email_contacts")
            .update({ total_opens: (contact?.total_opens || 0) + 1 })
            .eq("id", recData.contact_id);
        }
      } catch (e) {
        console.error("Open tracking error:", e);
      }
    }

    // Always return the pixel
    return new Response(TRACKING_PIXEL, {
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  }

  // CLICK TRACKING: GET /email-tracking?type=click&rid=...&cid=...&url=...
  if (url.searchParams.get("type") === "click") {
    const targetUrl = url.searchParams.get("url");

    if (recipientId && campaignId) {
      try {
        // Update recipient click stats
        const { data: recipient } = await supabase
          .from("email_campaign_recipients")
          .select("click_count")
          .eq("id", recipientId)
          .single();

        const clickCount = (recipient?.click_count || 0) + 1;
        const updateData: Record<string, unknown> = { click_count: clickCount };
        if (clickCount === 1) updateData.clicked_at = new Date().toISOString();

        await supabase
          .from("email_campaign_recipients")
          .update(updateData)
          .eq("id", recipientId);

        // Update campaign total clicks
        await supabase.rpc("increment_campaign_clicks", { p_campaign_id: campaignId });

        // Update contact total clicks
        const { data: recData } = await supabase
          .from("email_campaign_recipients")
          .select("contact_id")
          .eq("id", recipientId)
          .single();
        if (recData) {
          const { data: contact } = await supabase
            .from("email_contacts")
            .select("total_clicks")
            .eq("id", recData.contact_id)
            .single();
          await supabase
            .from("email_contacts")
            .update({ total_clicks: (contact?.total_clicks || 0) + 1 })
            .eq("id", recData.contact_id);
        }
      } catch (e) {
        console.error("Click tracking error:", e);
      }
    }

    // Redirect to the original URL
    if (targetUrl) {
      return new Response(null, {
        status: 302,
        headers: { Location: targetUrl },
      });
    }

    return new Response("Missing URL", { status: 400 });
  }

  return new Response("Invalid tracking type", { status: 400 });
});
