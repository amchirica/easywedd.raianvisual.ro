-- DEV ONLY — nu rula în producție.
-- Presupune un user auth existent și un workspace deja creat după onboarding.
-- Înlocuiește placeholder-ele înainte de execuție.

-- Exemplu (comentat):
-- select public.seed_default_budget_categories('<WORKSPACE_UUID>', '<WEDDING_UUID>');
-- select public.seed_wedding_task_template('<WORKSPACE_UUID>', '<WEDDING_UUID>', current_date + 120);

-- Date demonstrative opționale (dezactivate by default):
-- insert into public.guests (workspace_id, wedding_id, first_name, last_name, side, rsvp_status)
-- values
--   ('<WORKSPACE_UUID>', '<WEDDING_UUID>', 'Dev', 'Guest One', 'bride', 'pending'),
--   ('<WORKSPACE_UUID>', '<WEDDING_UUID>', 'Dev', 'Guest Two', 'groom', 'confirmed');
