-- Active: 1787051386721@@127.0.0.1@3306@haveiwatchit

CREATE DATABASE IF NOT EXISTS haveiwatchit
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE haveiwatchit;


SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS show_submission;
DROP TABLE IF EXISTS collection_follows;
DROP TABLE IF EXISTS collection_items;
DROP TABLE IF EXISTS collections;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS watchlist_items;
DROP TABLE IF EXISTS show_roles;
DROP TABLE IF EXISTS show_sources;
DROP TABLE IF EXISTS people;
DROP TABLE IF EXISTS show_platform;
DROP TABLE IF EXISTS shows;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;


CREATE TABLE users (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username     VARCHAR(100)    NOT NULL,
  email        VARCHAR(255)    NOT NULL,
  password     VARCHAR(255)    NOT NULL,
  role         ENUM('user','moderator','admin') NOT NULL DEFAULT 'user',
  is_verified  BOOLEAN         NOT NULL DEFAULT FALSE,
  is_suspended BOOLEAN         NOT NULL DEFAULT FALSE,
  reputation   INT             NOT NULL DEFAULT 0,
  created_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  avatar_url   VARCHAR(500)    NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email)
) ENGINE = InnoDB;

CREATE TABLE shows (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name           VARCHAR(255)    NOT NULL,
  type           ENUM('movie','series','tv_shows','anime') NOT NULL,
  synopsis       TEXT,
  photo_url      VARCHAR(500),
  cover_url      VARCHAR(500),
  status         ENUM('airing','completed','upcoming') NOT NULL,
  release_date   DATE,
  episode_count  INT,
  duration       INT,
  content_rating VARCHAR(10),
  created_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_shows_name (name)
) ENGINE = InnoDB;

CREATE TABLE show_platform (
  id       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name     VARCHAR(100)    NOT NULL,
  logo_url VARCHAR(500),
  url      VARCHAR(500),
  PRIMARY KEY (id)
) ENGINE = InnoDB;

CREATE TABLE show_sources (
  show_id     BIGINT UNSIGNED NOT NULL,
  platform_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (show_id, platform_id),
  CONSTRAINT fk_sources_show     FOREIGN KEY (show_id)     REFERENCES shows (id)         ON DELETE CASCADE,
  CONSTRAINT fk_sources_platform FOREIGN KEY (platform_id) REFERENCES show_platform (id) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE people (
  id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name      VARCHAR(255)    NOT NULL,
  bio       TEXT,
  photo_url VARCHAR(500),
  PRIMARY KEY (id),
  INDEX idx_people_name (name)
) ENGINE = InnoDB;

CREATE TABLE show_roles (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  role            VARCHAR(50)     NOT NULL,
  character_name  VARCHAR(255),
  character_photo VARCHAR(500),
  show_id         BIGINT UNSIGNED NOT NULL,
  people_id       BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_roles_show   FOREIGN KEY (show_id)   REFERENCES shows (id)  ON DELETE CASCADE,
  CONSTRAINT fk_roles_people FOREIGN KEY (people_id) REFERENCES people (id) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE watchlist_items (
  user_id    BIGINT UNSIGNED NOT NULL,
  show_id    BIGINT UNSIGNED NOT NULL,
  status     ENUM('wishlist','watching','watched','rewatching','on_hold','dropped') NOT NULL,
  updated_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, show_id),
  CONSTRAINT fk_watch_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_watch_show FOREIGN KEY (show_id) REFERENCES shows (id) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE reviews (
  user_id      BIGINT UNSIGNED NOT NULL,
  show_id      BIGINT UNSIGNED NOT NULL,
  review_txt   TEXT,
  review_score INT             NOT NULL,
  created_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, show_id),
  CONSTRAINT fk_reviews_user  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_show  FOREIGN KEY (show_id) REFERENCES shows (id) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE collections (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NOT NULL,
  name       VARCHAR(255)    NOT NULL,
  is_public  BOOLEAN         NOT NULL DEFAULT FALSE,
  share_uuid CHAR(36)        NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_collections_uuid (share_uuid),
  CONSTRAINT fk_collections_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE collection_items (
  collection_id BIGINT UNSIGNED NOT NULL,
  show_id       BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (collection_id, show_id),
  CONSTRAINT fk_citems_collection FOREIGN KEY (collection_id) REFERENCES collections (id) ON DELETE CASCADE,
  CONSTRAINT fk_citems_show       FOREIGN KEY (show_id)       REFERENCES shows (id)       ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE collection_follows (
  user_id       BIGINT UNSIGNED NOT NULL,
  collection_id BIGINT UNSIGNED NOT NULL,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, collection_id),
  KEY idx_collection_follows_collection (collection_id),
  CONSTRAINT fk_collection_follows_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_collection_follows_collection FOREIGN KEY (collection_id) REFERENCES collections (id) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE show_submission (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  submitted_by   BIGINT UNSIGNED NOT NULL,
  name           VARCHAR(255)    NOT NULL,
  type           ENUM('movie','series','tv_shows','anime') NOT NULL,
  synopsis       TEXT,
  photo_url      VARCHAR(500),
  content_rating VARCHAR(10),
  other_details  TEXT,
  status         ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  created_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_submission_user FOREIGN KEY (submitted_by) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB;



-- SAMPLE DATA
INSERT INTO users (id, username, email, password, role, is_verified) VALUES
 (1, 'admin', 'admin@example.com', '$2a$12$0JBkcIiTucd27sH0qLl/UeJ8qQn5jm9vX6ACuRCuiphZpbYiDkGWy', 'admin',     TRUE),
 (2, 'mod_0','mod@example.com', '$2b$10$qlNOJui/5c/3Vzzo5sKFDu8XCZS4B0onW7U3/lY0/uGxoEZN/8CPu', 'moderator', TRUE),
 (3, 'user_0','user0@example.com', '$2b$10$qlNOJui/5c/3Vzzo5sKFDu8XCZS4B0onW7U3/lY0/uGxoEZN/8CPu', 'user',      FALSE),
 (4, 'user_1', 'user1@example.com', '$2b$10$qlNOJui/5c/3Vzzo5sKFDu8XCZS4B0onW7U3/lY0/uGxoEZN/8CPu', 'user',      FALSE);

-- Shows
INSERT INTO shows (id, name, type, synopsis, status, release_date, episode_count, duration, content_rating) VALUES
 (1, 'Inception',        'movie',  'A thief who steals secrets through dreams is offered a chance to erase his past.', 'completed', '2010-07-16',  1, 148, 'PG-13'),
 (2, 'Attack on Titan',  'anime',  'Humanity fights man-eating giants from behind towering walls.',                    'completed', '2013-04-07', 87,  24, 'R'),
 (3, 'Breaking Bad',     'series', 'A chemistry teacher turns to cooking meth after a cancer diagnosis.',              'completed', '2008-01-20', 62,  47, 'TV-MA'),
 (4, 'Frieren: Beyond Journey''s End', 'anime', 'An elf mage reflects on life after the hero party''s quest ends.',       'airing',    '2023-09-29', 28,  24, 'PG-13'),
 (5, 'Dune: Part Three', 'movie',  'The next chapter of Paul Atreides'' saga.',                                         'upcoming',  '2026-12-18',  1, NULL, 'PG-13');

-- Streaming platforms
INSERT INTO show_platform (id, name, url) VALUES
 (1, 'Netflix',     'https://www.netflix.com'),
 (2, 'Crunchyroll', 'https://www.crunchyroll.com'),
 (3, 'Prime Video', 'https://www.primevideo.com');

-- Where to watch (show <-> platform)
INSERT INTO show_sources (show_id, platform_id) VALUES
 (1, 1), (2, 2), (3, 1), (4, 2), (4, 3);

-- People
INSERT INTO people (id, name, bio) VALUES
 (1, 'Leonardo DiCaprio', 'American actor and producer.'),
 (2, 'Christopher Nolan', 'British-American film director.'),
 (3, 'Bryan Cranston',    'American actor.'),
 (4, 'Aaron Paul',        'American actor.');

-- Cast and crew (show <-> people)
INSERT INTO show_roles (role, character_name, show_id, people_id) VALUES
 ('Actor',    'Dom Cobb',      1, 1),
 ('Director', NULL,            1, 2),
 ('Actor',    'Walter White',  3, 3),
 ('Actor',    'Jesse Pinkman', 3, 4);

-- Watchlists
INSERT INTO watchlist_items (user_id, show_id, status) VALUES
 (3, 1, 'watched'),
 (3, 2, 'watching'),
 (3, 4, 'wishlist'),
 (4, 3, 'rewatching');

-- Reviews
INSERT INTO reviews (user_id, show_id, review_txt, review_score) VALUES
 (3, 1, 'Mind-bending and beautifully shot.',  9),
 (4, 3, 'One of the best series ever made.',  10);

-- Collections (share_uuid are fixed so you can test the public link)
INSERT INTO collections (id, user_id, name, is_public, share_uuid) VALUES
 (1, 3, 'Weekend marathon', TRUE,  '11111111-1111-4111-8111-111111111111'),
 (2, 3, 'Private picks',    FALSE, '22222222-2222-4222-8222-222222222222');

INSERT INTO collection_items (collection_id, show_id) VALUES
 (1, 1), (1, 3), (2, 2);

-- Show requests waiting for moderator approval
INSERT INTO show_submission (submitted_by, name, type, synopsis, other_details) VALUES
 (4, 'Severance', 'series', 'Office workers have their memories surgically divided.', 'Streams on Apple TV+');


-- =====================================================================show_submissions
-- PART 5 : SANITY CHECK (you should see a row count per table)
-- =====================================================================
SELECT 'haveiwatchit ready' AS status;

SELECT 'users'           AS tbl, COUNT(*) AS `rows` FROM users
UNION ALL SELECT 'shows',           COUNT(*) FROM shows
UNION ALL SELECT 'show_platform',   COUNT(*) FROM show_platform
UNION ALL SELECT 'show_sources',    COUNT(*) FROM show_sources
UNION ALL SELECT 'people',          COUNT(*) FROM people
UNION ALL SELECT 'show_roles',      COUNT(*) FROM show_roles
UNION ALL SELECT 'watchlist_items', COUNT(*) FROM watchlist_items
UNION ALL SELECT 'reviews',         COUNT(*) FROM reviews
UNION ALL SELECT 'collections',     COUNT(*) FROM collections
UNION ALL SELECT 'collection_items',COUNT(*) FROM collection_items
UNION ALL SELECT 'show_submission', COUNT(*) FROM show_submission;
