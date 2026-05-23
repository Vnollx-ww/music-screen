USE music_screen;

CREATE TABLE IF NOT EXISTS generated_music (
  id CHAR(36) NOT NULL,
  model VARCHAR(64) NOT NULL,
  prompt TEXT NOT NULL,
  lyrics TEXT NULL,
  source_audio_url TEXT NOT NULL,
  minio_bucket VARCHAR(255) NOT NULL,
  minio_object_name VARCHAR(1024) NOT NULL,
  content_type VARCHAR(128) NULL,
  file_size_bytes BIGINT UNSIGNED NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'ready',
  raw_response JSON NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  expires_at TIMESTAMP(3) NOT NULL,
  deleted_at TIMESTAMP(3) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY generated_music_minio_object_name_idx (minio_object_name),
  KEY generated_music_expires_at_idx (expires_at),
  KEY generated_music_status_expires_at_idx (status, expires_at),
  CONSTRAINT generated_music_status_check CHECK (status IN ('ready', 'expired'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
