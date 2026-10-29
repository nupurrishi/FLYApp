-- Safe, additive FLYApp schema. It never drops or truncates existing data.
CREATE TABLE IF NOT EXISTS flyapp_records (
  entity text NOT NULL,
  id text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (entity, id)
);

CREATE INDEX IF NOT EXISTS flyapp_records_event_idx
  ON flyapp_records (entity, (data->>'event_id'));
CREATE INDEX IF NOT EXISTS flyapp_records_email_idx
  ON flyapp_records (entity, (lower(data->>'user_email')));
CREATE INDEX IF NOT EXISTS flyapp_records_model_email_idx
  ON flyapp_records (entity, (lower(data->>'model_email')));
CREATE INDEX IF NOT EXISTS flyapp_records_designer_email_idx
  ON flyapp_records (entity, (lower(data->>'designer_email')));
CREATE INDEX IF NOT EXISTS flyapp_records_created_idx
  ON flyapp_records (entity, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS flyapp_active_membership_unique_idx
  ON flyapp_records ((data->>'event_id'), lower(data->>'user_email'))
  WHERE entity = 'EventMember' AND data->>'status' <> 'removed';
CREATE UNIQUE INDEX IF NOT EXISTS flyapp_application_once_idx
  ON flyapp_records ((data->>'opportunity_id'), lower(data->>'user_email'))
  WHERE entity = 'Application';

CREATE TABLE IF NOT EXISTS flyapp_uploads (
  key text PRIMARY KEY,
  owner_user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  event_id text,
  mime_type text NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/avif')),
  original_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS flyapp_uploads_event_idx ON flyapp_uploads(event_id);
