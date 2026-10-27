DELIMITER //

CREATE PROCEDURE update_show_collections(
    IN p_user_id INT,
    IN p_show_id INT,
    IN p_add JSON,
    IN p_remove JSON
)
BEGIN
    DECLARE total_req INT DEFAULT 0;
    DECLARE owned_req INT DEFAULT 0;
    
    -- Yes, this is exactly the equivalent of a try-catch in MySQL
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Check ownership
    SELECT COUNT(DISTINCT r.id) INTO total_req
    FROM JSON_TABLE(JSON_MERGE_PRESERVE(p_add, p_remove), "$[*]" COLUMNS (id INT PATH "$")) r;
    
    SELECT COUNT(*) INTO owned_req
    FROM collections c
    WHERE c.user_id = p_user_id
    AND c.id IN (
        SELECT r.id
        FROM JSON_TABLE(JSON_MERGE_PRESERVE(p_add, p_remove), "$[*]" COLUMNS (id INT PATH "$")) r
    );

    -- At least one is not owned by user
    IF total_req <> owned_req THEN
        ROLLBACK;
        SIGNAL SQLSTATE "45000" SET MESSAGE_TEXT = "Unauthorized";
    END IF;
    
    -- Insert
    INSERT IGNORE INTO collection_items (collection_id, show_id)
    SELECT r.id, p_show_id
    FROM JSON_TABLE(p_add, "$[*]" COLUMNS (id INT PATH "$")) r;
    
    -- Delete
    DELETE FROM collection_items
    WHERE show_id = p_show_id AND collection_id IN (
        SELECT r.id FROM JSON_TABLE(p_remove, "$[*]" COLUMNS (id INT PATH "$")) r
    );
    
    COMMIT;
END //

DELIMITER ;