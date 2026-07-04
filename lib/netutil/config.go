package netutil

import (
	"fmt"
	"net"

	"github.com/eviltomorrow/personal-service/lib/system"
)

type Config struct {
	AccessIP   string `json:"access_ip" toml:"access_ip" mapstructure:"access_ip"`
	BindIP     string `json:"bind_ip" toml:"bind_ip" mapstructure:"bind_ip"`
	BindPort   int    `json:"bind_port" toml:"bind_port" mapstructure:"bind_port"`
	DisableTLS bool   `json:"disable_tls" toml:"disable_tls" mapstructure:"disable_tls"`
}

func (c *Config) String() string {
	return fmt.Sprintf("access_ip=%s, bind_ip=%s, bind_port=%d, disable_tls=%t",
		c.AccessIP, c.BindIP, c.BindPort, c.DisableTLS)
}

func (c *Config) VerifyConfig() error {
	if c.AccessIP != "" {
		if ip := net.ParseIP(c.AccessIP); ip == nil {
			return fmt.Errorf("network.access_ip has wrong format: %s", c.AccessIP)
		}
	}
	if c.BindIP != "0.0.0.0" {
		if ip := net.ParseIP(c.BindIP); ip == nil {
			return fmt.Errorf("network.bind_ip has wrong format: %s", c.BindIP)
		}
	}

	if c.BindPort <= 0 || c.BindPort > 65535 {
		return fmt.Errorf("network.bind_port has wrong format: %d", c.BindPort)
	}

	return nil
}

func (c *Config) ResetSystem() {
	if c.BindIP != "" {
		system.Network.SetBindIP(c.BindIP)
	} else {
		system.Network.SetBindIP("0.0.0.0")
	}
	if c.AccessIP != "" {
		system.Network.SetAccessIP(c.AccessIP)
	} else if system.Network.BindIP() == "0.0.0.0" {
		ip, err := GetInterfaceIPv4First()
		if err != nil {
			system.Network.SetAccessIP("0.0.0.0")
		} else {
			system.Network.SetAccessIP(ip)
		}
	} else {
		system.Network.SetAccessIP(system.Network.BindIP())
	}
}
