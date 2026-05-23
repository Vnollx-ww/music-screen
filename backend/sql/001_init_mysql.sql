CREATE DATABASE IF NOT EXISTS music_screen
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE music_screen;

CREATE TABLE IF NOT EXISTS songs (
  id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255) NULL,
  era VARCHAR(16) NOT NULL DEFAULT 'digital',
  votes INT UNSIGNED NOT NULL DEFAULT 0,
  play_count INT UNSIGNED NOT NULL DEFAULT 0,
  recommend_count INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY songs_created_at_desc_idx (created_at DESC),
  KEY songs_votes_desc_idx (votes DESC),
  CONSTRAINT songs_era_check CHECK (era IN ('vinyl', 'tape', 'cd', 'digital', 'ai'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS song_vote_ip_limits (
  ip_address VARCHAR(45) NOT NULL,
  vote_count INT UNSIGNED NOT NULL DEFAULT 0,
  first_voted_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  last_voted_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (ip_address),
  KEY song_vote_ip_limits_last_voted_at_desc_idx (last_voted_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
