-- Allows an authenticated barber to mark one of their own bookings as "paid".
-- Uses SECURITY DEFINER so it can bypass the RLS UPDATE policy (which only allows admins).
-- Safety: verifies that auth.uid() matches the barbers.user_id for the booking's barber_id.

CREATE OR REPLACE FUNCTION public.mark_booking_paid(_booking_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_barber_id UUID;
  v_caller_barber_id UUID;
BEGIN
  -- Find which barber this booking belongs to
  SELECT barber_id INTO v_barber_id
  FROM public.bookings
  WHERE id = _booking_id;

  IF v_barber_id IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  -- Find the barber linked to the calling auth user
  SELECT id INTO v_caller_barber_id
  FROM public.barbers
  WHERE user_id = auth.uid();

  -- Allow if: caller is the barber for this booking OR caller is an admin
  IF v_caller_barber_id IS DISTINCT FROM v_barber_id
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized to mark this booking as paid';
  END IF;

  -- Only allow transition from confirmed → paid (not from pending/cancelled/etc.)
  UPDATE public.bookings
  SET status = 'paid'
  WHERE id = _booking_id
    AND status = 'confirmed';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking must be in confirmed status to be marked as done';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_booking_paid(UUID) TO authenticated;
