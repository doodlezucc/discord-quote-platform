CREATE VIRTUAL TABLE sound_search_fts USING fts5(
  name, keywords, id UNINDEXED,
  content='sound', content_rowid='rowid',
  tokenize='porter unicode61 remove_diacritics 2'
);
--> statement-breakpoint
INSERT INTO sound_search_fts(sound_search_fts) VALUES ('rebuild');
--> statement-breakpoint
CREATE TRIGGER fts_trigger_insert AFTER INSERT ON sound BEGIN
  INSERT INTO sound_search_fts(rowid, name, keywords, id)
  VALUES (new.rowid, new.name, new.keywords, new.id);
END;
--> statement-breakpoint
CREATE TRIGGER fts_trigger_delete AFTER DELETE ON sound BEGIN
  INSERT INTO sound_search_fts(sound_search_fts, rowid, name, keywords, id)
  VALUES ('delete', old.rowid, old.name, old.keywords, old.id);
END;
--> statement-breakpoint
CREATE TRIGGER fts_trigger_update AFTER UPDATE ON sound BEGIN
  INSERT INTO sound_search_fts(sound_search_fts, rowid, name, keywords, id)
  VALUES ('delete', old.rowid, old.name, old.keywords, old.id);
  INSERT INTO sound_search_fts(rowid, name, keywords, id)
  VALUES (new.rowid, new.name, new.keywords, new.id);
END;
