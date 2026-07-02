CREATE TABLE IF NOT EXISTS balance_sheet_items (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    account_id    VARCHAR(32)     NOT NULL COMMENT 'FK to accounts.account_id',
    section       TINYINT         NOT NULL COMMENT '1=asset 2=liability 3=equity',
    category      VARCHAR(32)     NOT NULL COMMENT '流动资产/固定资产/流动负债/非流动负债/净资产',
    name          VARCHAR(128)    NOT NULL COMMENT 'item name e.g. 现金及银行存款',
    amount        DECIMAL(15,2)   NOT NULL COMMENT 'positive amount in yuan',
    note          VARCHAR(256)    NOT NULL DEFAULT '' COMMENT 'optional note',
    date          VARCHAR(7)      NOT NULL COMMENT 'YYYY-MM',
    sort_order    INT             NOT NULL DEFAULT 0,
    deleted_at    BIGINT UNSIGNED NOT NULL DEFAULT 0,
    created_at    BIGINT UNSIGNED NOT NULL DEFAULT 0,
    updated_at    BIGINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_account_date (account_id, date, deleted_at),
    KEY idx_account_section (account_id, section, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
