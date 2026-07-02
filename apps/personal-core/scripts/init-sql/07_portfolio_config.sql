CREATE TABLE IF NOT EXISTS portfolio_config (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    account_id    VARCHAR(32)     NOT NULL,
    total_capital DECIMAL(15,2)   NOT NULL DEFAULT 0,
    updated_at    BIGINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_account (account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
