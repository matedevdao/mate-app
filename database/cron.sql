SELECT cron.schedule(
  'ping_pong_daily', -- 작업 이름 (매일 실행)
  '0 0 * * *', -- Cron 표현식: 매일 자정 실행 (24시간마다)
  $$
  -- Edge Function 호출
  select net.http_post(
      'https://ylkawitqgpeiysldwtgs.supabase.co/functions/v1/ping',
      body := '{}'::JSONB,
      headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlsa2F3aXRxZ3BlaXlzbGR3dGdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU4ODUzNzIsImV4cCI6MjA1MTQ2MTM3Mn0.NViN7OIedhMxJWDnBF1O3812JHRHdGhiN67ta5MWDus"}'::JSONB
  ) AS request_id;
  $$
);