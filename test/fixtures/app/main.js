const { app, BrowserWindow, ipcMain } = require('electron')
const fs = require('fs')
const path = require('path')

let mainWindow = null
app.allowRendererProcessReuse = true

app.on('ready', () => {
  console.log('main log')
  console.warn('main warn')
  console.error('main error')

  global.mainProcessGlobal = 'foo'
  global.ipcEventCount = 0

  mainWindow = new BrowserWindow({
    x: 25,
    y: 35,
    width: 200,
    height: 100,
    webPreferences: {
      nodeIntegration: true
    }
  })
  mainWindow.loadFile('index.html')
  mainWindow.on('closed', () => { mainWindow = null })
})

app.on('will-quit', () => {
  if (fs.existsSync(process.env.SPECTRON_TEMP_DIR)) {
    fs.writeFileSync(path.join(process.env.SPECTRON_TEMP_DIR, 'quit.txt'), '')
  }
})

ipcMain.on('ipc-event', (event, count) => {
  global.ipcEventCount += count
})
