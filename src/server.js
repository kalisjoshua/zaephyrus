const fs = require("fs")
const http = require("http")
const path = require("path")
const {URL} = require("url")

const routes = []

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

function handler(request, response) {
  const start = Date.now()

  request.method = request.method.toUpperCase()
  request.url = new URL(`http://${getHost(request.rawHeaders)}${request.url}`)

  console.log(`${request.method} ${request.url}`)

  let resourceID
  const resource = routes
    .reduce((acc, {collection, entity, route}) => {
      if (acc || !route.test(request.url.pathname)) return acc

      resourceID = (request.url.pathname.match(route) || [])[1]

      return resourceID ? entity : collection
    }, false)

  const pendingResponse = !resource
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

  pendingResponse
    .then(({body, status} = {}) => {
      const plaintext = {"Content-type": "text/plain"}
      const contentType = response.contentType || plaintext

      if (body instanceof Error || status >= 500) {
        const msg = "Internal server error."
        const starbar = Array(30).join("*")

        console.log([starbar, msg, body, starbar].join("\n\n"))

        response.writeHead(status || 500, msg, plaintext)
        response.end(msg)
      } else {
        response.writeHead(status || 200, contentType)
        response.end(body && contentType["Content-type"] === "application/json"
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
}
