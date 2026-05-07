-- ============================================================
-- recipient_subscriptions — 부모님 디바이스 Web Push 구독
-- ============================================================
-- 부모님은 인증을 거치지 않고 share link만으로 진입하므로
-- subscription insert/delete는 server에서 service role로 처리한다.
-- 자식(소유자)은 자기 recipients의 subscriptions 목록을 조회 가능하다.
-- ============================================================

create table public.recipient_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.recipients(id) on delete cascade,
  endpoint     text not null unique,
  p256dh       text not null,
  auth         text not null,
  user_agent   text,
  created_at   timestamptz not null default now()
);

create index recipient_subscriptions_recipient_idx
  on public.recipient_subscriptions (recipient_id);

alter table public.recipient_subscriptions enable row level security;

create policy "owner_read_recipient_subscriptions"
  on public.recipient_subscriptions for select
  using (
    exists (
      select 1 from public.recipients r
      where r.id = recipient_id and r.user_id = auth.uid()
    )
  );

-- INSERT/DELETE는 server-side service role로만 (다른 정책 없음 = anon/authenticated 차단)
