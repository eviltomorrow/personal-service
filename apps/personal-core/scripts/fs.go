package scripts

import (
	"embed"
)

//go:embed init-sql/*.sql
var FS embed.FS
