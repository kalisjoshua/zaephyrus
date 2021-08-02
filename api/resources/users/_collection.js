module.exports = {
  GET(request, response) {
    response.body = `collection`
    response.status = 200

    return response
  },
}
