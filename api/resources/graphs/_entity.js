module.exports = {
  GET(request, response) {
    response.body = `<svg></svg>`
    response.status = 200
    response.contentType = {'Content-type': 'image/svg+xml'}

    return response
  },
}
