package snowflake

import (
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/bwmarrin/snowflake"
)

var (
	machineID     int64 = 1
	node          *snowflake.Node
	limiterLength = 19
)

func init() {
	if v := os.Getenv("SNOWFLAKE_MACHINE_ID"); v != "" {
		id, err := strconv.ParseInt(v, 10, 64)
		if err == nil && id >= 0 && id <= 1023 {
			machineID = id
		}
	}

	n, err := snowflake.NewNode(machineID)
	if err != nil {
		panic(fmt.Errorf("snowflake NewNode failure, nest error: %v", err))
	}
	node = n
}

func GenerateID() string {
	var (
		id     = node.Generate()
		result = id.String()
	)
	switch {
	case len(result) < limiterLength:
		var (
			n   = limiterLength - len(result)
			buf strings.Builder
		)
		for i := 0; i < n; i++ {
			buf.WriteString("0")
		}
		buf.WriteString(result)
		return buf.String()
	default:
		return result
	}
}
