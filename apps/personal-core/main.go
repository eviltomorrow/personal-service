package main

import (
	"fmt"
	"os"

	"github.com/eviltomorrow/personal-service/lib/buildinfo"
	"github.com/eviltomorrow/personal-service/lib/system"

	"github.com/eviltomorrow/personal-service/apps/personal-core/cmd"
)

var (
	AppName     string
	MainVersion string
	GitSha      string
	BuildTime   string
)

func main() {
	buildinfo.AppName = AppName
	buildinfo.MainVersion = MainVersion
	buildinfo.GitSha = GitSha
	buildinfo.BuildTime = BuildTime

	if err := system.LoadRuntime(); err != nil {
		fmt.Fprintf(os.Stderr, "[Fatal] load runtime failure: %v\n", err)
		os.Exit(1)
	}

	if err := cmd.Run(); err != nil {
		fmt.Fprintf(os.Stderr, "[Fatal] run app failure: %v\n", err)
		os.Exit(1)
	}
}
