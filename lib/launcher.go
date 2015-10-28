package main

import "os"
import "os/exec"

func main() {
  launcherArgs := append([]string{os.Getenv("SPECTRON_LAUNCHER_PATH")}, os.Args[1:]...)
  launcherCommand := exec.Command(os.Getenv("SPECTRON_NODE_PATH"), launcherArgs...)
  launcherCommand.Stdout = os.Stdout
  launcherCommand.Stderr = os.Stderr

  startError := launcherCommand.Start()
  if startError != nil {
    os.Exit(1)
  }

  exitError := launcherCommand.Wait()
  if exitError != nil {
    os.Exit(1)
  }
}
