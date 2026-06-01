package netutil

import (
	"fmt"
	"net"
)

func GetAvailablePort() (int, error) {
	address, err := net.ResolveTCPAddr("tcp", ":0")
	if err != nil {
		return 0, err
	}

	listen, err := net.ListenTCP("tcp", address)
	if err != nil {
		return 0, err
	}
	defer listen.Close()

	return listen.Addr().(*net.TCPAddr).Port, nil
}

func IsPortAvailable(port int) bool {
	listen, err := net.Listen("tcp", fmt.Sprintf(":%d", port))
	if err != nil {
		return false
	}
	listen.Close()
	return true
}
