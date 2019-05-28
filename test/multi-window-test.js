var helpers = require('./global-setup')
var path = require('path')

var describe = global.describe
var it = global.it
var beforeEach = global.beforeEach
var afterEach = global.afterEach

describe('multiple windows', function () {
  helpers.setupTimeout(this)

  var app = null

  beforeEach(function () {
    return helpers.startApplication({
      args: [path.join(__dirname, 'fixtures', 'multi-window')]
    }).then(function (startedApp) { app = startedApp })
  })

  afterEach(function () {
    return helpers.stopApplication(app)
  })

  it('should switch focus thanks to windowByIndex', async function () {
    const windowCount = await app.client.getWindowCount()
    windowCount.should.equal(2)

    const windowsData = {}

    const window0 = app.client.windowByIndex(0)
    const window0Title = await window0.browserWindow.getTitle()
    const window0Bounds = await window0.browserWindow.getBounds()
    windowsData[window0Title] = window0Bounds

    const window1 = app.client.windowByIndex(1)
    const window1Title = await window1.browserWindow.getTitle()
    const window1Bounds = await window1.browserWindow.getBounds()
    windowsData[window1Title] = window1Bounds

    windowsData['Top'].should.roughly(5).deep.equal({
      x: 25,
      y: 35,
      width: 200,
      height: 100
    })
    windowsData['Bottom'].should.roughly(5).deep.equal({
      x: 25,
      y: 135,
      width: 300,
      height: 50
    })
  })

  it('should switch focus thanks to switchWindow', function () {
    return app.client
      .getWindowCount().should.eventually.equal(2)
      .switchWindow('Top')
      .getTitle().should.eventually.equal('Top')
      .switchWindow('Bottom')
      .getTitle().should.eventually.equal('Bottom')
      .switchWindow('index-top.html')
      .getTitle().should.eventually.equal('Top')
      .switchWindow('index-bottom.html')
      .getTitle().should.eventually.equal('Bottom')
  });
})
