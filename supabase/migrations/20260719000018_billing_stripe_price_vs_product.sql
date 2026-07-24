-- Separate Stripe Product vs Price IDs on billing_plans.
-- Checkout must use stripe_price_id (price_…), never stripe_product_id (prod_…).

alter table public.billing_plans
  add column if not exists stripe_product_id text,
  add column if not exists stripe_price_id text;

comment on column public.billing_plans.stripe_product_id is
  'Stripe Product ID (prod_…). Catalog reference only — never pass to Checkout.';
comment on column public.billing_plans.stripe_price_id is
  'Stripe Price ID (price_…). Required for Checkout line_items[].price.';
comment on column public.billing_plans.stripe_price_env is
  'Optional env var name that holds a Price ID (price_…). Fallback when stripe_price_id is null.';

-- Helpful check constraints (allow null; reject obvious product ids in price column)
alter table public.billing_plans
  drop constraint if exists billing_plans_stripe_price_id_format;
alter table public.billing_plans
  add constraint billing_plans_stripe_price_id_format
  check (
    stripe_price_id is null
    or stripe_price_id ~ '^price_[A-Za-z0-9]+$'
  );

alter table public.billing_plans
  drop constraint if exists billing_plans_stripe_product_id_format;
alter table public.billing_plans
  add constraint billing_plans_stripe_product_id_format
  check (
    stripe_product_id is null
    or stripe_product_id ~ '^prod_[A-Za-z0-9]+$'
  );

-- Seed known Product IDs (catalog). Price IDs must be set in Admin → Planuri or env.
update public.billing_plans set stripe_product_id = 'prod_UvDe40qRHgbtxr'
  where key = 'starter' and stripe_product_id is null;
update public.billing_plans set stripe_product_id = 'prod_UvDfkmT4t7aXLv'
  where key = 'premium_pass_12' and stripe_product_id is null;
update public.billing_plans set stripe_product_id = 'prod_UvDfkcwllSETvl'
  where key = 'premium_pass_18' and stripe_product_id is null;
update public.billing_plans set stripe_product_id = 'prod_UvDf8eqlooptlY'
  where key = 'pro' and stripe_product_id is null;
