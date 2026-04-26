
-- Schedule identity stitching worker to run every minute
SELECT cron.schedule(
  'process-identity-stitch-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://euocvkvdixpxfznrduzi.supabase.co/functions/v1/process-identity-stitch',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
