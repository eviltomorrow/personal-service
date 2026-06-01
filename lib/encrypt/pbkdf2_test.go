package encrypt

import (
	"fmt"
	"testing"
)

func TestKey(t *testing.T) {
	s := Salt()
	p := Key(s, "Shepard")
	fmt.Println(s, p, len(s), len(p))
}
