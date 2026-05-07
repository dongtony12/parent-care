-- ============================================================
-- Parent Care PWA — Initial Schema
-- ============================================================
-- 본인 1명이 쓰는 시스템이지만 RLS는 활성화 (보안 + 향후 확장)
-- 모든 시각은 timestamptz (UTC 저장, 클라이언트에서 KST 변환)
-- entry_date만 KST 기준 date (하루의 경계가 자정이 되도록)
-- ============================================================

-- 공통: updated_at 자동 갱신
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- 1. daily_entries — 하루 한 건의 기록 (점심/저녁/일과 묶음)
-- ------------------------------------------------------------
create table public.daily_entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  entry_date    date not null,
  diary_text    text,
  final_message text,
  status        text not null default 'draft'
                  check (status in ('draft', 'queued', 'sent', 'failed')),
  sent_at       timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, entry_date)
);

create index daily_entries_user_date_idx
  on public.daily_entries (user_id, entry_date desc);

create trigger daily_entries_set_updated_at
  before update on public.daily_entries
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 2. meal_photos — 점심/저녁 사진
-- ------------------------------------------------------------
create table public.meal_photos (
  id           uuid primary key default gen_random_uuid(),
  entry_id     uuid not null references public.daily_entries(id) on delete cascade,
  meal_type    text not null check (meal_type in ('lunch', 'dinner')),
  storage_path text not null,
  caption      text,
  captured_at  timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  unique (entry_id, meal_type)
);

create index meal_photos_entry_idx
  on public.meal_photos (entry_id);

-- ------------------------------------------------------------
-- 3. push_subscriptions — Web Push (디바이스마다 1건)
-- ------------------------------------------------------------
create table public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create index push_subscriptions_user_idx
  on public.push_subscriptions (user_id);

-- ------------------------------------------------------------
-- 4. recipients — 부모님 (수신자)
-- ------------------------------------------------------------
create table public.recipients (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  phone      text not null,
  channel    text not null default 'sms' check (channel in ('sms')),
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

create index recipients_user_idx
  on public.recipients (user_id);

-- ------------------------------------------------------------
-- 5. send_logs — 발송 기록 (디버깅/재시도)
-- ------------------------------------------------------------
create table public.send_logs (
  id                  uuid primary key default gen_random_uuid(),
  entry_id            uuid not null references public.daily_entries(id) on delete cascade,
  recipient_id        uuid not null references public.recipients(id) on delete cascade,
  status              text not null check (status in ('success', 'failed')),
  error_message       text,
  provider_message_id text,
  sent_at             timestamptz not null default now()
);

create index send_logs_entry_idx
  on public.send_logs (entry_id);

-- ============================================================
-- RLS — 본인만 자기 데이터 접근
-- ============================================================
alter table public.daily_entries       enable row level security;
alter table public.meal_photos         enable row level security;
alter table public.push_subscriptions  enable row level security;
alter table public.recipients          enable row level security;
alter table public.send_logs           enable row level security;

create policy "own_entries"
  on public.daily_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "own_meal_photos"
  on public.meal_photos for all
  using (
    exists (
      select 1 from public.daily_entries e
      where e.id = entry_id and e.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.daily_entries e
      where e.id = entry_id and e.user_id = auth.uid()
    )
  );

create policy "own_subscriptions"
  on public.push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "own_recipients"
  on public.recipients for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- send_logs: 클라이언트는 조회만, insert는 서버(service_role)에서
create policy "own_send_logs_read"
  on public.send_logs for select
  using (
    exists (
      select 1 from public.daily_entries e
      where e.id = entry_id and e.user_id = auth.uid()
    )
  );

-- ============================================================
-- Storage 정책 — meal-photos 버킷
-- ============================================================
-- 사전 작업: Supabase Dashboard > Storage 에서 'meal-photos' 버킷 생성 (private)
-- 경로 규칙: {user_id}/{entry_id}/{meal_type}-{timestamp}.jpg
create policy "own_meal_photos_read"
  on storage.objects for select
  using (
    bucket_id = 'meal-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "own_meal_photos_write"
  on storage.objects for insert
  with check (
    bucket_id = 'meal-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "own_meal_photos_delete"
  on storage.objects for delete
  using (
    bucket_id = 'meal-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
