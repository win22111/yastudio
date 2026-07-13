-- 1. Create a validation function to enforce booking business rules
CREATE OR REPLACE FUNCTION public.check_booking_validity()
RETURNS TRIGGER AS $$
DECLARE
  booking_date DATE;
  has_conflict BOOLEAN;
  is_blocked BOOLEAN;
BEGIN
  -- Convert starts_at to Iraq/Baghdad local date
  booking_date := (NEW.starts_at AT TIME ZONE 'Asia/Baghdad')::date;

  -- A. Check if the day is blocked for the whole shop or for this specific barber
  SELECT EXISTS (
    SELECT 1 
    FROM public.blocked_days 
    WHERE date = booking_date 
      AND (barber_id IS NULL OR barber_id = NEW.barber_id)
  ) INTO is_blocked;

  IF is_blocked THEN
    RAISE EXCEPTION 'هذا اليوم مغلق للحجوزات لهذا الحلاق أو للمحل بالكامل / This day is closed for bookings';
  END IF;

  -- B. Check for double bookings / overlaps for active bookings
  -- A slot conflict exists if another active booking (not cancelled/no_show) 
  -- for the same barber overlaps with this booking's time window.
  SELECT EXISTS (
    SELECT 1 
    FROM public.bookings
    WHERE barber_id = NEW.barber_id
      AND status NOT IN ('cancelled', 'no_show')
      -- If updating, exclude the current row itself
      AND (TG_OP = 'INSERT' OR id != NEW.id)
      AND (starts_at < NEW.ends_at AND ends_at > NEW.starts_at)
  ) INTO has_conflict;

  IF has_conflict THEN
    RAISE EXCEPTION 'هذا الموعد محجوز مسبقاً / This time slot is already booked';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Bind the check to the bookings table using a BEFORE trigger
DROP TRIGGER IF EXISTS trg_check_booking_validity ON public.bookings;
CREATE TRIGGER trg_check_booking_validity
  BEFORE INSERT OR UPDATE OF barber_id, starts_at, ends_at, status
  ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.check_booking_validity();
