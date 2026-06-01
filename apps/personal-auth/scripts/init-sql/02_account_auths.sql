DROP TABLE IF EXISTS account_auths;
CREATE TABLE account_auths (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    account_id    VARCHAR(32)     NOT NULL COMMENT '关联 accounts',
    auth_type     VARCHAR(16)     NOT NULL COMMENT '登录方式: username, email, phone, wechat...',
    identifier    VARCHAR(128)    NOT NULL COMMENT '登录标识',
    status        TINYINT         NOT NULL DEFAULT 1 COMMENT '0=inactive 1=active',
    verified      TINYINT         NOT NULL DEFAULT 0 COMMENT '0=unverified 1=verified',
    deleted_at    BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '软删除时间',
    created_at    BIGINT UNSIGNED NOT NULL DEFAULT 0,
    updated_at    BIGINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_auth (auth_type, identifier),
    KEY idx_account_id (account_id),
    KEY idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
