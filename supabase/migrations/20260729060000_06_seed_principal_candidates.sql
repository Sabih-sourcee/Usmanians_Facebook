-- Seed default principal candidates when empty
insert into public.principal_candidates (full_name, bio, class_name)
select * from (values
  ('Dr. Arshad Mahmood', 'Campus 12 leadership nominee', 'Campus 12'),
  ('Prof. Naila Farooq', 'Main Campus leadership nominee', 'Main Campus'),
  ('Dr. Tariq Hassan', 'West Wing leadership nominee', 'West Wing')
) as v(full_name, bio, class_name)
where not exists (select 1 from public.principal_candidates limit 1);
