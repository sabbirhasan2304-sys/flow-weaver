
-- Fix: pgmq.metrics returns intervals/timestamps already, simplify the projection.
DROP FUNCTION IF EXISTS public.get_queue_stats(text);

CREATE OR REPLACE FUNCTION public.get_queue_stats(queue_name text)
RETURNS TABLE(
  queue text,
  queue_length bigint,
  total_messages bigint,
  newest_msg_age_sec numeric,
  oldest_msg_age_sec numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.queue_name::text,
    m.queue_length,
    m.total_messages,
    EXTRACT(EPOCH FROM (now() - m.newest_msg_age_sec))::numeric,
    EXTRACT(EPOCH FROM (now() - m.oldest_msg_age_sec))::numeric
  FROM pgmq.metrics(queue_name) m;
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT queue_name::text, 0::bigint, 0::bigint, 0::numeric, 0::numeric;
END;
$$;
