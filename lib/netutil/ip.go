package netutil

import (
	"errors"
	"fmt"
	"net"
	"strings"
	"time"

	jsoniter "github.com/json-iterator/go"
)

type IPType int

const (
	IPV4 IPType = iota
	IPV6
)

func GetInterfaceFirst() (string, error) {
	e := make([]error, 0, 2)
	ip, err := GetInterfaceIPv4First()
	if err != nil {
		e = append(e, err)
	}
	if ip != "" {
		return ip, nil
	}

	ip, err = GetInterfaceIPv6First()
	if err != nil {
		e = append(e, err)
	}
	if ip != "" {
		return ip, nil
	}

	return "", fmt.Errorf("panic: get ipv4/ipv6 failure, nest error: %v", errors.Join(e...))
}

func GetInterfaceIPv4First() (string, error) {
	return getInterfaceIPFirst(IPV4)
}

func GetInterfaceIPv6First() (string, error) {
	return getInterfaceIPFirst(IPV6)
}

func GetLocalareaIP(network, address string) (string, error) {
	conn, err := net.DialTimeout(network, address, 10*time.Second)
	if err != nil {
		return "", err
	}
	defer conn.Close()

	localAddr := conn.LocalAddr().(*net.UDPAddr)
	hostPort := strings.Split(localAddr.String(), ":")
	if len(hostPort) != 2 {
		return "", fmt.Errorf("panic: invalid host_port, value: %v", hostPort)
	}

	host := hostPort[0]
	host = strings.TrimPrefix(host, "[")
	host = strings.TrimSuffix(host, "]")

	return host, nil
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

func GetInterfaceIPList(filters ...func(string) bool) ([]string, error) {
	inters, err := net.Interfaces()
	if err != nil {
		return nil, err
	}

	ipList := make([]string, 0, len(inters))
loop:
	for _, inter := range inters {
		for _, filter := range filters {
			if filter(inter.Name) {
				continue loop
			}
		}
		if inter.Flags&net.FlagUp != 0 && !strings.HasPrefix(inter.Name, "lo") {
			addrs, err := inter.Addrs()
			if err != nil {
				continue
			}
			for _, addr := range addrs {
				if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
					if ipnet.IP.To4() != nil {
						ipList = append(ipList, ipnet.IP.String())
					} else if ipnet.IP.To16() != nil {
						ipList = append(ipList, ipnet.IP.String())
					}
				}
			}
		}
	}
	if len(ipList) == 0 {
		return nil, fmt.Errorf("not found any ip")
	}
	return ipList, nil
}

// *******************************************************************************

// IPNetworkInfo 包含 IP 网络信息
type IPNetworkInfo struct {
	OriginalAddress string `json:"original_address"`
	NetworkAddress  string `json:"network_address"`
	GatewayAddress  string `json:"gateway_address"`
	PrefixLength    int    `json:"prefix_length"`
	HostBits        int    `json:"host_bits"`
	IsValid         bool   `json:"is_valid"`
	IsIPv6          bool   `json:"is_ipv6"`
	TotalBits       int    `json:"total_bits"`
}

func (i *IPNetworkInfo) String() string {
	buf, _ := jsoniter.ConfigCompatibleWithStandardLibrary.Marshal(i)
	return string(buf)
}

// GetIPNetworkInfo 获取 IP 地址的网络信息（同时支持 IPv4 和 IPv6）
func GetIPNetworkInfo(ipWithPrefix string) (*IPNetworkInfo, error) {
	// 解析 CIDR 表示法
	ip, ipNet, err := net.ParseCIDR(ipWithPrefix)
	if err != nil {
		return nil, fmt.Errorf("解析 CIDR 失败: %v", err)
	}

	// 判断是 IPv4 还是 IPv6
	isIPv6 := ip.To4() == nil
	totalBits := 32
	if isIPv6 {
		totalBits = 128
	}

	// 获取前缀长度
	prefixLen, _ := ipNet.Mask.Size()

	// 计算网络地址
	networkIP := ipNet.IP

	// 计算网关地址（通常是网络地址的第一个可用地址）
	gatewayIP := calculateGatewayIP(networkIP, prefixLen, isIPv6)

	// 计算主机位数
	hostBits := totalBits - prefixLen

	// 构建网关地址字符串（带前缀）
	gatewayStr := gatewayIP.String()
	if isIPv6 {
		gatewayStr = fmt.Sprintf("%s", gatewayIP.String())
	} else {
		gatewayStr = fmt.Sprintf("%s", gatewayIP.String())
	}

	return &IPNetworkInfo{
		OriginalAddress: ipWithPrefix,
		NetworkAddress:  ipNet.String(),
		GatewayAddress:  gatewayStr,
		PrefixLength:    prefixLen,
		HostBits:        hostBits,
		IsValid:         true,
		IsIPv6:          isIPv6,
		TotalBits:       totalBits,
	}, nil
}

// calculateGatewayIP 计算网关IP，适配IPv4和IPv6
func calculateGatewayIP(networkIP net.IP, prefixLen int, isIPv6 bool) net.IP {
	// 确定地址长度和字节数
	totalBytes := 4
	if isIPv6 {
		totalBytes = 16
	}

	// 将IP转换为对应长度的字节切片
	var ipBytes []byte
	if isIPv6 {
		ipBytes = networkIP.To16()
	} else {
		ipBytes = networkIP.To4()
	}

	// 创建一个新的IP字节切片副本
	gatewayBytes := make([]byte, totalBytes)
	copy(gatewayBytes, ipBytes)

	// 根据IP类型和前缀长度计算网关
	if isIPv6 {
		// IPv6网关计算逻辑
		if prefixLen <= 126 {
			// 从最后一个字节开始加1
			for i := totalBytes - 1; i >= 0; i-- {
				if gatewayBytes[i] < 255 {
					gatewayBytes[i]++
					break
				} else {
					gatewayBytes[i] = 0
				}
			}
		} else if prefixLen == 127 {
			// /127 网络
			gatewayBytes[totalBytes-1]++
		}
		// /128 网络没有网关，保持为网络地址
	} else {
		// IPv4网关计算逻辑
		if prefixLen <= 30 {
			// 从最后一个字节开始加1
			for i := totalBytes - 1; i >= 0; i-- {
				if gatewayBytes[i] < 255 {
					gatewayBytes[i]++
					break
				} else {
					gatewayBytes[i] = 0
				}
			}
		} else if prefixLen == 31 {
			// /31 网络（点对点）
			gatewayBytes[totalBytes-1]++
		}
		// /32 网络没有网关，保持为网络地址
	}

	if isIPv6 {
		return net.IP(gatewayBytes)
	}
	return net.IPv4(gatewayBytes[0], gatewayBytes[1], gatewayBytes[2], gatewayBytes[3])
}
