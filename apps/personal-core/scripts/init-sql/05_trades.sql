CREATE TABLE IF NOT EXISTS trades (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    account_id    VARCHAR(32)     NOT NULL,
    position_id   BIGINT UNSIGNED NOT NULL COMMENT 'FK to positions.id',
    type          TINYINT         NOT NULL COMMENT '1=建仓 2=买入 3=卖出 4=清仓',
    date          DATE            NOT NULL,
    price         DECIMAL(15,2)   NOT NULL,
    quantity      INT             NOT NULL,
    note          VARCHAR(256)    NOT NULL DEFAULT '',
    deleted_at    BIGINT UNSIGNED NOT NULL DEFAULT 0,
    created_at    BIGINT UNSIGNED NOT NULL DEFAULT 0,
    updated_at    BIGINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_position (position_id, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
