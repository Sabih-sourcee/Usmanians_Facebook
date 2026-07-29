-- Fix security warning: use security_invoker so the view runs with the
-- calling user's RLS policies instead of the view owner's privileges.
-- principal_votes and principal_candidates both have verified-user SELECT
-- policies, so the aggregation still works for authenticated users.

create or replace view public.principal_vote_results
  with (security_invoker = true) as
select
  c.id as candidate_id,
  c.full_name,
  c.photo_url,
  count(v.id)::bigint as vote_count
from public.principal_candidates c
left join public.principal_votes v on v.candidate_id = c.id
group by c.id, c.full_name, c.photo_url;
