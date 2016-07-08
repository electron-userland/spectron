var axsPath = require.resolve('../vendor/axs_testing')

exports.addCommand = function (client, requireName) {
  client.addCommand('auditAccessibility', function (options) {
    return this.execute(function (axsPath, requireName, options) {
      options = options || {}
      var ignoreWarnings = options.ignoreWarnings || false
      var ignoreRules = Array.isArray(options.ignoreRules) ? options.ignoreRules : []

      var axs = window[requireName](axsPath)
      var audit = axs.Audit.run(new axs.AuditConfiguration({
        showUnsupportedRulesWarning: false
      }))

      var failures = audit.filter(function (result) {
        return result.result === 'FAIL'
      })

      if (ignoreWarnings) {
        failures = failures.filter(function (result) {
          return result.rule.severity !== 'Warning'
        })
      }

      failures = failures.filter(function (result) {
        return ignoreRules.indexOf(result.rule.code) === -1
      })

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
    }, axsPath, requireName, options).then(function (response) {
      return response.value
    })
  })
}
