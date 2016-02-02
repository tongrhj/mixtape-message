const app = require('./app.js')
const port = process.env.PORT || 8888
app.listen(port)
console.log(`Ready on port ${ port }`)
