/**
 * Created by Thinkpad on 2017/3/19.
 */
const fs = rootRequire('fs')

module.exports = function (app) {

  try {
    fs.readdirSync(__dirname)
      .filter(filename => filename !== 'index.js')
      .map(filename => rootRequire(`app/routers/${filename}`))
      .forEach(router => {
        app.use(router.routes(), router.allowedMethods())
      })
  } catch (e) {
    app.emit('error', e)
  }
}