-- ============================================================
-- recipients.share_code 추가
-- ============================================================
-- 부모님이 인증 없이 자식의 카드를 볼 수 있는 share link용 토큰
-- url-safe base64로 12바이트 (16자) 길이
-- ============================================================

alter table public.recipients
  add column share_code text;

-- 기존 row 백필 (url-safe base64)
update public.recipients
  set share_code = replace(
    replace(encode(gen_random_bytes(12), 'base64'), '+', '-'),
    '/',
    '_'
  )
  where share_code is null;

alter table public.recipients
  alter column share_code set not null;

alter table public.recipients
  add constraint recipients_share_code_unique unique (share_code);

create index recipients_share_code_idx
  on public.recipients (share_code);
