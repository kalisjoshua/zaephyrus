const fs = require('fs')
const http = require('http')
const path = require('path')
const {URL} = require('url')

const contentTypeJSON = {'Content-type': 'application/json'}
const routes = []

const fullPath = (...parts) => path.join(__dirname, ...parts)
const getHost = (list) => list
  .reduce((acc, str, i) => acc || (/^host$/i.test(str) ? list[i + 1] : acc), !1)

function bodyParser(request) {
  const body = []

  return new Promise((resolve, reject) => {
    request
      .on('error', () => reject(new Error('Error receiving the request body.')))
      .on('data', (chunk) => body.push(chunk))
      .on('end', () => {
        try {
          resolve(body.length ? JSON.parse(Buffer.concat(body).toString()) : '')
        } catch (e) {
          reject(new Error('Error parsing the request body.'))
        }
      })
  })
}

function handler(request, response) {
  request.method = request.method.toUpperCase()
  request.url = new URL(`http://${getHost(request.rawHeaders)}${request.url}`)

  console.log(`${request.method} ${request.url}`)

  let resourceID
  const [requestHandler, contentType] = routes
    .reduce((acc, [route, {collection, entity, contentType}]) => {
      if (acc || !route.test(request.url.pathname)) {
        return acc
      }

      resourceID = (request.url.pathname.match(route) || [])[1]

      return [(resourceID ? entity : collection)[request.method], contentType]
    }, false) || []

  const pendingResponse = !requestHandler
    ? Promise.resolve({body: 'Not Found.', status: 404})
    : bodyParser(request)
      .then((body) => requestHandler({
        ...request,
        body,
        data: {resourceID},
      }, response))
      .then((body) => body ? body : Promise.reject('Method not allowed.'))
      .catch((body) => ({body, status: 400}))

  pendingResponse
    .then(({body, status} = {}) => {
      console.log(`${status || 500} ${request.method} ${request.url.pathname}`)
      response.writeHead(status || 500, contentType)
      response.end(JSON.stringify(body || ''))
    })
}

function register({route, ...resourceConfig}) {
  // TODO: add error checking for regex and function
  routes.push([route, {
    contentType: contentTypeJSON,
    ...resourceConfig,
  }])

  return module.exports
}

function resources (dir = 'resources') {
  fs.readdirSync(fullPath(dir))
    .forEach((str) => {
      const resource = require(fullPath(dir, str))
      const route = str.replace(/\.js$/, '')

      resource.route = new RegExp(`^\\/${route}(?:\\/(.*))?$`, 'i')

      register(resource)
    })

  return module.exports
}

function start(port = 8888) {
  http
    .createServer(handler)
    .listen(port)

  console.log(`Server running at http://127.0.0.1:${port}`)
}

module.exports = {
  register,
  resources,
  start,
}
