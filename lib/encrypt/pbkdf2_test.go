package encrypt

import (
	"fmt"
	"testing"
)

func TestKey(t *testing.T) {
	s, err := Salt()
	if err != nil {
		t.Fatal(err)
	}
	p := Key(s, "Shepard")
	fmt.Println(s, p, len(s), len(p))
}
