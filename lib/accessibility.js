var axsPath = require.resolve('../vendor/axs_testing')

exports.addCommand = function (client, requireName) {
  client.addCommand('auditAccessibility', function (options) {
    options = options || {}
    var ignoreWarnings = options.ignoreWarnings || false

    return this.execute(function (axsPath, requireName, ignoreWarnings) {
      var axs = window[requireName](axsPath)
      var config = {
        withConsoleApi: true,
        showUnsupportedRulesWarning: false
      }
      var audit = axs.Audit.run()

      var failures = audit.filter(function (result) {
        return result.result === 'FAIL'
      })

      if (ignoreWarnings) {
        failures = failures.filter(function (result) {
          return result.rule.severity !== 'Warning'
        })
      }

      if (failures.length > 0) {
        var message = 'Accessibilty audit failed\n\n'
        message += failures.map(function (result) {
          return axs.Audit.accessibilityErrorMessage(result)
        }).join('\n\n')

        return {
          message: message,
          failed: true,
          results: failures.map(function (result) {
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
    }, axsPath, requireName, ignoreWarnings).then(function (response) {
      return response.value
    })
  })
}
