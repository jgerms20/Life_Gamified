create extension if not exists pg_net;
create extension if not exists pg_cron;

-- Hourly sweep for the morning digest and the evening streak guard.
select cron.schedule(
  'life-gamified-reminders',
  '0 * * * *',
  $$
  select net.http_post(
    url := 'https://zsgacmfbqqmbcexomyoo.supabase.co/functions/v1/lg-agent/push/cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select value from public.lg_config where key = 'cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
