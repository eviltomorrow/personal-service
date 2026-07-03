CREATE TABLE IF NOT EXISTS profiles (
    id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    account_id VARCHAR(32)     NOT NULL,
    nickname   VARCHAR(64)     NOT NULL DEFAULT '',
    email      VARCHAR(255)    NOT NULL DEFAULT '',
    bio        TEXT            NOT NULL,
    avatar_url VARCHAR(512)    NOT NULL DEFAULT '',
    created_at BIGINT UNSIGNED NOT NULL DEFAULT 0,
    updated_at BIGINT UNSIGNED NOT NULL DEFAULT 0,
    deleted_at BIGINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_account (account_id, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
