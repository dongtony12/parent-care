-- ============================================================
-- daily_entries.delivered_at 추가
-- ============================================================
-- 자식이 「발송」 한 시점에는 entry status='sent'로 마킹만 하고
-- 부모님 push는 익일 오전 7시 cron이 일괄 발송 (잠 안 깨우려는 배려).
-- delivered_at은 push 발송 완료 시점에 채워진다.
-- ============================================================

alter table public.daily_entries
  add column delivered_at timestamptz;

create index daily_entries_pending_delivery_idx
  on public.daily_entries (entry_date, status)
  where delivered_at is null;
