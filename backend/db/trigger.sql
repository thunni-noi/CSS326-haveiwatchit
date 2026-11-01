ALTER TABLE shows
    ADD COLUMN avg_score    DECIMAL(4,2) NULL,
    ADD COLUMN review_count    INT UNSIGNED NOT NULL DEFAULT 0;
    
    
DELIMITER //
CREATE PROCEDURE calc_show_score(IN p_show_id BIGINT UNSIGNED)
BEGIN
    DECLARE r_count INT UNSIGNED;
    DECLARE r_avg DECIMAL(6, 3);
    
    SELECT COUNT(*), AVG(review_score)
    INTO r_count, r_avg
    FROM reviews
    WHERE show_id = p_show_id;
    
    IF r_count = 0 THEN
        SET r_avg = 0;
    END IF;
    
    UPDATE shows
    SET review_count = r_count,
        avg_score = ROUND(r_avg, 2)
    WHERE id = p_show_id;
END //
--trigger only handle later review change and somehow ignore the existed review data, this backfill will fix that
UPDATE shows s
LEFT JOIN (
    SELECT show_id, COUNT(*) AS review_count, AVG(review_score) AS avg_score
    FROM reviews
    GROUP BY show_id
) r ON r.show_id = s.id
SET s.review_count = COALESCE(r.review_count, 0),
    s.avg_score = ROUND(r.avg_score, 2);

CREATE TRIGGER tgr_review_on_insert AFTER INSERT ON reviews
FOR EACH ROW CALL calc_show_score(NEW.show_id) // -- change to calc_show_score instead of recalc_review_rating

CREATE TRIGGER tgr_review_on_update AFTER UPDATE ON reviews
FOR EACH ROW CALL calc_show_score(NEW.show_id) //

CREATE TRIGGER tgr_review_on_delete AFTER DELETE ON reviews
FOR EACH ROW CALL calc_show_score(OLD.show_id) //


DELIMITER ;