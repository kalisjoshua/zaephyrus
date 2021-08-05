const fs = require("fs")
const fsPromise = require("fs/promises")
const http = require("http")
const path = require("path")
const {URL} = require("url")

const mimes = require("./mimes.json")

const routes = []
const static = []

const contentTypeHeader = (type) => ({"Content-type": mimes[type] || mimes.text})
const fullPath = (...parts) => path.join(__dirname, ...parts)
const getHost = (list) => list
  .reduce((acc, str, i) => acc || (/^host$/i.test(str) ? list[i + 1] : acc), !1)

function bodyParser(request) {
  const body = []

  return new Promise((resolve, reject) => {
    request
      .on("error", () => reject(new Error("Error receiving the request body.")))
      .on("data", (chunk) => body.push(chunk))
      .on("end", () => {
        try {
          resolve(body.length ? JSON.parse(Buffer.concat(body).toString()) : "")
        } catch (e) {
          reject(new Error("Error parsing the request body."))
        }
      })
  })
}

function handleDynamic (request, response) {
  let resourceID
  const resource = routes
    .reduce((acc, {collection, entity, route}) => {
      if (acc || !route.test(request.url.pathname)) return acc

      resourceID = (request.url.pathname.match(route) || [])[1]

      return resourceID ? entity : collection
    }, false)

  return !resource
    ? Promise.resolve({body: "Not Found.", status: 404})
    : !resource[request.method]
      ? Promise.resolve({body: "Method not allowed.", status: 405})
      : bodyParser(request)
        .then((body) => resource[request.method]({
          ...request,
          body,
          data: {resourceID},
        }, response))
        .catch((body) => ({body, status: 400}))
}

function handleStatic (absPath, response) {

  return fsPromise.readFile(absPath, 'utf8')
    .then((body) => {
      const [ext] = (/\.([^$]+)$/.exec(absPath) || []).slice(1)

      response.contentType = contentTypeHeader(ext)

      return {body, status: 200}
    })
}

function handler(request, response) {
  const start = Date.now()

  if (request.url === "/") {
    request.url = "/index.html"
  }

  request.method = request.method.toUpperCase()
  request.url = new URL(`http://${getHost(request.rawHeaders)}${request.url}`)

  console.log(`${request.method} ${request.url}`)

  const isStatic = static
    .map((staticPath) => {
      const absPath = path
        .join(__dirname, staticPath, request.url.pathname)

      return fsPromise.stat(absPath)
        .then(() => absPath)
    })

  Promise.any(isStatic)
    .then((absPath) => handleStatic(absPath, response))
    .catch(() => handleDynamic(request, response))
    .then(({body, status} = {}) => {
      const plaintext = contentTypeHeader("text")
      const contentType = response.contentType || plaintext

      if (body instanceof Error || status >= 500) {
        const msg = "Internal server error."

        console.log(msg, '\n\n', body, '\n\n')

        response.writeHead(status || 500, msg, plaintext)
        response.end(msg)
      } else {
        response.writeHead(status || 200, contentType)
        response.end(body && contentType["Content-type"] === mimes.json
          ? JSON.stringify(body)
          : body)
      }

      console.log([
        status || 500,
        request.method,
        request.url.pathname,
        `(took ${Date.now() - start} miliseconds).`,
      ].join(' '))
    })
}

module.exports = {
  resources (dir = "resources") {
    fs.readdirSync(fullPath(dir))
      .forEach((route) => {
        routes.push({
          collection: require(fullPath(dir, route, "_collection.js")),
          entity: require(fullPath(dir, route, "_entity.js")),
          route: new RegExp(`^\\/${route}(?:\\/(.*))?$`, "i"),
        })
      })

    return this
  },
  start (port = 8888) {
    http
      .createServer(handler)
      .listen(port)

    console.log(`Server running at http://127.0.0.1:${port}`)
  },
  static (staticPath) {
    if (fs.statSync(path.join(__dirname, staticPath))) {
      static.push(staticPath)
    }

    return this
  }
}
