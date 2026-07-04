-- Add optional barber_id to blocked_days
-- NULL barber_id = whole shop is closed
-- A barber UUID = only that barber is unavailable

ALTER TABLE blocked_days
  ADD COLUMN IF NOT EXISTS barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE;

-- Drop the old single-column unique constraint on 'date'
ALTER TABLE blocked_days DROP CONSTRAINT IF EXISTS blocked_days_date_key;

-- Add a composite unique constraint.
-- NULLS NOT DISTINCT means two rows with the same date and barber_id=NULL
-- are treated as duplicates — exactly what we need for the full-shop block.
-- This also allows ON CONFLICT (date, barber_id) to work in upserts.
ALTER TABLE blocked_days
  ADD CONSTRAINT blocked_days_date_barber_unique
  UNIQUE NULLS NOT DISTINCT (date, barber_id);
