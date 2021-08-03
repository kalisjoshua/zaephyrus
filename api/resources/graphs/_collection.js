const {createGraph} = require("./graph.js")

module.exports = {
  GET(request, response) {
    response.body = createGraph(decodeURIComponent(request.url.search))
    response.status = 200
    response.contentType = {"Content-type": "image/svg+xml"}

    return response
  },
}
