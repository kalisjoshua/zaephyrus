module.exports = {
  GET(request, response) {
    response.body = `entity ${request.data.resourceID}`
    response.status = 200

    return response
  },
}
