DROP TABLE IF EXISTS login_history;
CREATE TABLE login_history (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    account_id      VARCHAR(32)     NOT NULL DEFAULT '' COMMENT '关联 accounts',
    auth_type       VARCHAR(16)     NOT NULL COMMENT '使用的登录方式',
    identifier      VARCHAR(128)    NOT NULL COMMENT '登录时输入的标识值',
    ip_address      VARCHAR(45)     NOT NULL DEFAULT '' COMMENT '客户端 IP',
    user_agent      VARCHAR(512)    NOT NULL DEFAULT '' COMMENT '客户端 User-Agent',
    status          TINYINT         NOT NULL DEFAULT 0 COMMENT '0=失败 1=成功',
    failure_reason  VARCHAR(128)    NOT NULL DEFAULT '' COMMENT '失败原因',
    created_at      BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '登录时间',
    PRIMARY KEY (id),
    KEY idx_account_id (account_id),
    KEY idx_identifier (identifier),
    KEY idx_ip_address (ip_address),
    KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='登录历史记录';
