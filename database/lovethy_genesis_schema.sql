-- LOVE THY GENESIS DATABASE SCHEMA

CREATE EXTENSION IF NOT EXISTS postgis;

--------------------------------------------------
-- PROFILES
--------------------------------------------------

CREATE TABLE profiles (
  id uuid PRIMARY KEY,
  phone text,
  name text,
  location geography(POINT,4326),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_profiles_location
ON profiles USING GIST (location);

--------------------------------------------------
-- NEIGHBORHOOD EVENTS
--------------------------------------------------

CREATE TABLE neighborhood_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  status text DEFAULT 'active'
    CHECK (status IN ('active','completed','expired','cancelled')),
  title text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  location geography(POINT,4326) NOT NULL,
  start_time timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_active_events_spatial
ON neighborhood_events
USING GIST(location)
WHERE status='active';

CREATE INDEX idx_events_timeline
ON neighborhood_events (start_time DESC, status);

CREATE INDEX idx_events_creator
ON neighborhood_events (user_id);

--------------------------------------------------
-- NEIGHBOR OFFERINGS
--------------------------------------------------

CREATE TABLE neighbor_offerings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  category text,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_offerings_user_id
ON neighbor_offerings(user_id);

--------------------------------------------------
-- ROW LEVEL SECURITY
--------------------------------------------------

ALTER TABLE neighborhood_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY enforce_neighborhood_radius
ON neighborhood_events
FOR SELECT
USING (
  user_id = auth.uid()
  OR (
    status = 'active'
    AND (
      expires_at IS NULL
      OR expires_at > now()
    )
    AND EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = auth.uid()
      AND ST_DWithin(
        neighborhood_events.location,
        p.location,
        1126
      )
    )
  )
);

--------------------------------------------------
-- CREATE EVENT RPC
--------------------------------------------------

CREATE OR REPLACE FUNCTION create_neighborhood_event(
  p_event_type text,
  p_title text,
  p_description text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_expires_at timestamptz DEFAULT (now() + interval '7 days')
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_location geography(POINT,4326);
  v_new_id uuid;
BEGIN

  SELECT location
  INTO v_user_location
  FROM profiles
  WHERE id = auth.uid();

  IF v_user_location IS NULL THEN
    RAISE EXCEPTION 'Profile location required';
  END IF;

  INSERT INTO neighborhood_events (
    user_id,
    event_type,
    title,
    description,
    metadata,
    location,
    expires_at,
    status
  )
  VALUES (
    auth.uid(),
    p_event_type,
    p_title,
    p_description,
    p_metadata,
    v_user_location,
    p_expires_at,
    'active'
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;

END;
$$;

--------------------------------------------------
-- FEED VIEW
--------------------------------------------------

CREATE OR REPLACE VIEW active_neighborhood_feed AS
SELECT
  id,
  user_id,
  event_type,
  title,
  description,
  metadata,
  location,
  start_time
FROM neighborhood_events
WHERE status='active'
AND (
  expires_at IS NULL
  OR expires_at > now()
)
ORDER BY start_time DESC;

--------------------------------------------------
-- NEIGHBORHOOD STATE MACHINE
--------------------------------------------------

CREATE OR REPLACE FUNCTION get_neighborhood_state()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
  v_my_location geography(POINT,4326);
BEGIN

  SELECT location
  INTO v_my_location
  FROM profiles
  WHERE id = auth.uid();

  SELECT count(*)
  INTO v_count
  FROM profiles
  WHERE id <> auth.uid()
  AND ST_DWithin(
    location,
    v_my_location,
    1126
  );

  IF v_count = 0 THEN
    RETURN 'founder';
  END IF;

  IF v_count < 9 THEN
    RETURN 'sparse';
  END IF;

  RETURN 'atomic';

END;
$$;
