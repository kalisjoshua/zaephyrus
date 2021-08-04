const fs = require('fs')
const path = require('path')

const lib = `const zaephyrus = (function (module) {
  ${fs.readFileSync(path.join(__dirname, 'browser.js'), 'utf8')}

  const {init} = module.exports

  ${fs.readFileSync(path.join(__dirname, 'graph.js'), 'utf8')}

  init(module.exports.createGraph)

  return module.exports
}({}))`

module.exports = {
  GET(request, response) {
    if (request.data.resourceID === "zaephyrus.js") {
      response.body = lib
      response.status = 200
      response.contentType = {"Content-type": "application/javascript"}
    } else {
      response.status = 404
    }

    return response
  },
}
