module.exports = {
  collection: {
    GET(request, response) {
      response.body = 'collection'
      response.status = 200

      return response
    }
  },

  entity: {
    GET(request, response) {
      response.body = `entity ${request.data.resourceID}`
      response.status = 200

      return response
    }
  },
}
