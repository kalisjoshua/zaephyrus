require('./server.js')
  .resources()
  .start(process.env.PORT || 8000)
