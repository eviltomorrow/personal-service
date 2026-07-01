CREATE TABLE IF NOT EXISTS transactions (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    account_id    VARCHAR(32)     NOT NULL COMMENT 'FK to accounts.account_id',
    category_id   BIGINT UNSIGNED NOT NULL COMMENT 'FK to categories.id',
    type          TINYINT         NOT NULL COMMENT '1=income 2=expense',
    name          VARCHAR(128)    NOT NULL COMMENT 'transaction name',
    amount        DECIMAL(15,2)   NOT NULL COMMENT 'positive amount',
    date          DATE            NOT NULL COMMENT 'transaction date',
    note          VARCHAR(256)    NOT NULL DEFAULT '' COMMENT 'optional note',
    sort_order    INT             NOT NULL DEFAULT 0 COMMENT 'display order within category',
    deleted_at    BIGINT UNSIGNED NOT NULL DEFAULT 0,
    created_at    BIGINT UNSIGNED NOT NULL DEFAULT 0,
    updated_at    BIGINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_account_date (account_id, date, deleted_at),
    KEY idx_account_category (account_id, category_id, deleted_at),
    KEY idx_cat_sort (category_id, sort_order, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
