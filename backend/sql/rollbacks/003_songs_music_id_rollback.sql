USE music_screen;

ALTER TABLE songs
  DROP FOREIGN KEY songs_music_id_fk,
  DROP KEY songs_music_id_idx,
  DROP COLUMN music_id;
