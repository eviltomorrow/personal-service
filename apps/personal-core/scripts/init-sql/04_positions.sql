CREATE TABLE IF NOT EXISTS positions (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    account_id    VARCHAR(32)     NOT NULL COMMENT 'FK to accounts.account_id',
    code          VARCHAR(32)     NOT NULL COMMENT '股票/期货代码',
    name          VARCHAR(64)     NOT NULL COMMENT '名称',
    type          TINYINT         NOT NULL COMMENT '1=股票 2=期货',
    direction     TINYINT         NOT NULL COMMENT '1=做多 2=做空',
    initial_qty   INT             NOT NULL DEFAULT 0,
    current_price DECIMAL(15,2)   NOT NULL DEFAULT 0,
    margin_ratio  INT             NOT NULL DEFAULT 0 COMMENT 'basis points, e.g. 1000=10.00%',
    sort_order    INT             NOT NULL DEFAULT 0,
    archived      TINYINT(1)      NOT NULL DEFAULT 0,
    closed_pnl    DECIMAL(15,2)   NOT NULL DEFAULT 0,
    deleted_at    BIGINT UNSIGNED NOT NULL DEFAULT 0,
    created_at    BIGINT UNSIGNED NOT NULL DEFAULT 0,
    updated_at    BIGINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_account (account_id, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
