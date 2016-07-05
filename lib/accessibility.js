var axsPath = require.resolve('../vendor/axs_testing')

exports.addCommand = function (client, requireName) {
  client.addCommand('performAccessibilityAudit', function () {
    return this.execute(function (axsPath, requireName) {
      var axs = window[requireName](axsPath)
      var results = axs.Audit.run().filter(function (result) {
        return result.result === 'FAIL'
      })

      if (results.length > 0) {
        var message = 'Accessibilty audit failed\n\n'
        message += results.map(function (result) {
          return axs.Audit.accessibilityErrorMessage(result)
        }).join('\n\n')

        return {
          message: message,
          failed: true,
          results: results.map(function (result) {
            return {
              code: result.rule.code,
              elements: result.elements.map(function (element) {
                return axs.utils.getQuerySelectorText(element)
              }),
              message: result.rule.heading,
              severity: result.rule.severity,
              url: result.rule.url
            }
          })
        }
      } else {
        return {
          message: 'Accessibilty audit passed',
          results: [],
          failed: false
        }
      }
    }, axsPath, requireName).then(function (response) {
      return response.value
    })
  })
}
