-- revert name length to 60 and add char_length CHECK constraint
DELETE FROM users WHERE char_length(name) < 20 OR char_length(name) > 60;
ALTER TABLE users ALTER COLUMN name TYPE VARCHAR(60);
ALTER TABLE users ADD CONSTRAINT users_name_length CHECK (char_length(name) BETWEEN 20 AND 60);
