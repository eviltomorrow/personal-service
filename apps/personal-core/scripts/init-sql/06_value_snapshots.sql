CREATE TABLE IF NOT EXISTS value_snapshots (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    account_id    VARCHAR(32)     NOT NULL,
    date          DATE            NOT NULL,
    total_value   DECIMAL(15,2)   NOT NULL,
    created_at    BIGINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_account_date (account_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
