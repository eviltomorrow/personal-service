DROP TABLE IF EXISTS accounts;
CREATE TABLE accounts (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    account_id    VARCHAR(32)     NOT NULL COMMENT '雪花 ID',
    role          VARCHAR(16)     NOT NULL DEFAULT 'user',
    status        TINYINT         NOT NULL DEFAULT 1 COMMENT '0=inactive 1=active 2=frozen',
    password_hash VARCHAR(64)     NOT NULL DEFAULT '' COMMENT '密码哈希',
    salt          VARCHAR(64)     NOT NULL DEFAULT '' COMMENT '密码盐值',
    deleted_at    BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '软删除时间',
    created_at    BIGINT UNSIGNED NOT NULL DEFAULT 0,
    updated_at    BIGINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_account_id (account_id),
    KEY idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
