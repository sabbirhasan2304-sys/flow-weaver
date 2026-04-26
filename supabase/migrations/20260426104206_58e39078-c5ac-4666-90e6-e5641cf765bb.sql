
-- Phase 0: Tracking Queue Foundation
-- Creates pgmq queues for async tracking event processing and conversion recovery,
-- plus helper RPCs that mirror the email queue pattern.

-- 1. Create the queues (idempotent)
DO $$
BEGIN
  PERFORM pgmq.create('tracking_events_queue');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  PERFORM pgmq.create('tracking_events_dlq');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  PERFORM pgmq.create('recovery_queue');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  PERFORM pgmq.create('recovery_dlq');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2. Generic enqueue helper (works for any queue)
CREATE OR REPLACE FUNCTION public.enqueue_message(queue_name text, payload jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$$;

-- 3. Generic batch reader
CREATE OR REPLACE FUNCTION public.read_message_batch(queue_name text, batch_size integer, vt integer)
RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$$;

-- 4. Generic delete
CREATE OR REPLACE FUNCTION public.delete_message(queue_name text, message_id bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$$;

-- 5. Move to DLQ (reuses move_to_dlq pattern)
CREATE OR REPLACE FUNCTION public.move_message_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$$;

-- 6. Queue stats helper for the admin dashboard
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
  RETURN;
END;
$$;
