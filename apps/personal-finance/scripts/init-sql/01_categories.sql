CREATE TABLE IF NOT EXISTS categories (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    account_id    VARCHAR(32)     NOT NULL COMMENT 'FK to accounts.account_id',
    name          VARCHAR(64)     NOT NULL COMMENT 'category name',
    type          TINYINT         NOT NULL COMMENT '1=income 2=expense',
    sort_order    INT             NOT NULL DEFAULT 0,
    deleted_at    BIGINT UNSIGNED NOT NULL DEFAULT 0,
    created_at    BIGINT UNSIGNED NOT NULL DEFAULT 0,
    updated_at    BIGINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_account_deleted (account_id, deleted_at),
    KEY idx_account_type (account_id, type, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
