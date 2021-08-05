require('./server.js')
  .resources()
  .static("/docs")
  .start(process.env.PORT || 8000)
