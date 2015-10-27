package main

import "os"
import "os/exec"

func main() {
  launcherCommand := exec.Command(os.Args[1], os.Args[2:]...)
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
