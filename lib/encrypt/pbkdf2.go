package encrypt

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"io"

	"golang.org/x/crypto/pbkdf2"
)

func Salt() string {
	b := make([]byte, 16)
	if _, err := io.ReadFull(rand.Reader, b); err != nil {
		panic(err)
	}
	return hex.EncodeToString(b)
}

func Key(salt, password string) string {
	key := pbkdf2.Key([]byte(password), []byte(salt), 600000, 32, sha256.New)
	return hex.EncodeToString(key)
}
