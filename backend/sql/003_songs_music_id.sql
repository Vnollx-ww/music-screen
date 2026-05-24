USE music_screen;

ALTER TABLE songs
  ADD COLUMN music_id CHAR(36) NULL AFTER id,
  ADD KEY songs_music_id_idx (music_id),
  ADD CONSTRAINT songs_music_id_fk
    FOREIGN KEY (music_id) REFERENCES generated_music(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL;
