require('./server.js')
  .resources()
  .static("/demo")
  .start(process.env.PORT || 8000)
