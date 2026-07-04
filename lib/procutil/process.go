package procutil

import (
	"fmt"
	"runtime"

	"github.com/eviltomorrow/personal-service/lib/buildinfo"
	"github.com/fatih/color"
)

var (
	bold      = color.New(color.Bold)
	greenbold = color.New(color.FgGreen, color.Bold)
)

func printStopped() {
	fmt.Printf("%s %s \r\n",
		greenbold.Sprint("Status:"), bold.Sprint("stopped"),
	)
}

func printRunning(pid int) {
	fmt.Printf("%s %s\r\n%s %s, %s => [%s %s, %s %s/%s] \r\n",
		greenbold.Sprint("Status:"), bold.Sprint("running"),
		greenbold.Sprint("Version:"), bold.Sprint(buildinfo.MainVersion),
		greenbold.Sprint("Runtime"), greenbold.Sprint("Pid:"), bold.Sprintf("%d", pid),
		greenbold.Sprint("OS/Arch:"), bold.Sprint(runtime.GOOS), bold.Sprint(runtime.GOARCH),
	)
}
