-- ============================================================
-- WHG TEAM PORTAL — POLICY SIGNATURE IMAGES
-- Adds support for handwritten finger signatures captured on
-- mobile, replacing the typed-name-only flow.
--
-- 1) Adds policy_signatures.signature_image_url — nullable so
--    legacy typed-only signatures remain valid.
-- 2) Creates the 'signatures' Storage bucket — PNG files keyed
--    by user_id + policy_id + version.
-- 3) Storage policies — authenticated users can upload their
--    own signatures; managers/admins can read for compliance.
--
-- Idempotent.
-- ============================================================

-- 1) Image URL column on policy_signatures
alter table policy_signatures
  add column if not exists signature_image_url text;

-- 2) Storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'signatures',
  'signatures',
  false,                                    -- private bucket; access via signed URLs or admin
  524288,                                   -- 512 KB max per signature image (PNG ~5-30 KB typical)
  array['image/png', 'image/jpeg', 'image/svg+xml']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 3) Storage policies
-- INSERT: authenticated users can upload to their own folder (path starts with their user id).
drop policy if exists "signatures_user_upload_own" on storage.objects;
create policy "signatures_user_upload_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'signatures'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- SELECT: user can read their own; managers/admins can read all in their site.
drop policy if exists "signatures_user_read_own" on storage.objects;
create policy "signatures_user_read_own"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'signatures'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from profiles p
        where p.id = auth.uid()
          and p.role in ('manager', 'assistant_manager', 'admin')
      )
    )
  );

-- UPDATE / DELETE: not allowed — signatures are immutable.
drop policy if exists "signatures_no_modify" on storage.objects;
