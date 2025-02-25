SELECT cron.schedule(
  'ping_pong_daily', -- 작업 이름 (매일 실행)
  '0 0 * * *', -- Cron 표현식: 매일 자정 실행 (24시간마다)
  $$
  -- Edge Function 호출
  select net.http_post(
      'https://psvyfwerxzofecujpkjt.supabase.co/functions/v1/ping',
      body := '{}'::JSONB,
      headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzdnlmd2VyeHpvZmVjdWpwa2p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0NTc3MjAsImV4cCI6MjA1NjAzMzcyMH0.8pYFC97szdr5rmGZWm01fdhQR2MEo3N7qoOMNHjcCB4"}'::JSONB
  ) AS request_id;
  $$
);