/**
 * Created by Thinkpad on 2017/3/19.
 */
// const fs = require('fs')
//
// module.exports = function (app) {
//
//   try {
//     fs.readdirSync(__dirname)
//       .filter(filename => filename !== 'index.js')
//       .map(filename => require(`./${filename}`))
//       .forEach(router => {
//         app.use(router.routes(), router.allowedMethods())
//       })
//   } catch (e) {
//     app.emit('error', e)
//   }
// }

// parties
//var Router = require('koa-router');

// local
var fs = require('fs');
var path = require('path');
var util = require('util');

var db = require('./../db/mysql/index.js');

//var router = new Router();

module.exports = function (app) {

    try {
        var loadDir = (dir) => {
            fs
                .readdirSync(dir)
                .forEach((file) => {
                    var nextPath = path.join(dir, file);
                    var stat = fs.statSync(nextPath);
                    if (stat.isDirectory()) {
                        loadDir(nextPath);
                    } else if (stat.isFile() && file.indexOf('.') !== 0 && file !== 'index.js' && file !== 'url.js') {
                        const router = require(nextPath)
                        app.use(router.routes(), router.allowedMethods());
                    }
                });
        };

        loadDir(__dirname);
    } catch (e) {
        app.emit('error', e)
    }
}
