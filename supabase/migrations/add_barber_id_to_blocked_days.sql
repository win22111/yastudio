-- Add optional barber_id to blocked_days
-- NULL barber_id = whole shop is closed
-- A barber UUID = only that barber is unavailable

-- 1. Drop the old primary key constraint on 'date' column
ALTER TABLE blocked_days DROP CONSTRAINT IF EXISTS blocked_days_pkey;

-- 2. Add an optional barber_id column
ALTER TABLE blocked_days ADD COLUMN IF NOT EXISTS barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE;

-- 3. Add an id column to act as the primary key
ALTER TABLE blocked_days ADD COLUMN IF NOT EXISTS id UUID NOT NULL DEFAULT gen_random_uuid();

-- 4. Set the id column as the primary key
ALTER TABLE blocked_days ADD CONSTRAINT blocked_days_id_pkey PRIMARY KEY (id);

-- 5. Add a composite unique constraint.
-- NULLS NOT DISTINCT means two rows with the same date and barber_id=NULL
-- are treated as duplicates — exactly what we need for the full-shop block.
-- This also allows ON CONFLICT (date, barber_id) to work in upserts.
ALTER TABLE blocked_days DROP CONSTRAINT IF EXISTS blocked_days_date_barber_unique;
ALTER TABLE blocked_days
  ADD CONSTRAINT blocked_days_date_barber_unique
  UNIQUE NULLS NOT DISTINCT (date, barber_id);
