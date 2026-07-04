package netutil

import (
	"errors"
	"net"
	"strings"
)

type IPType int

const (
	IPV4 IPType = iota
	IPV6
)

func GetInterfaceIPv4First() (string, error) {
	return getInterfaceIPFirst(IPV4)
}

func GetInterfaceIPv6First() (string, error) {
	return getInterfaceIPFirst(IPV6)
}

func getInterfaceIPFirst(it IPType) (string, error) {
	inters, err := net.Interfaces()
	if err != nil {
		return "", err
	}
	for _, inter := range inters {
		if inter.Flags&net.FlagUp != 0 && !strings.HasPrefix(inter.Name, "lo") && !strings.HasPrefix(inter.Name, "docker") && !strings.HasPrefix(inter.Name, "virbr") {
			addrs, err := inter.Addrs()
			if err != nil {
				continue
			}
			for _, addr := range addrs {
				if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
					switch it {
					case IPV4:
						if ipnet.IP.To4() != nil {
							return ipnet.IP.String(), nil
						}
					case IPV6:
						if ipnet.IP.To16() != nil {
							return ipnet.IP.String(), nil
						}
					}
				}
			}
		}
	}
	return "", errors.New("panic: unable to get first ip")
}
