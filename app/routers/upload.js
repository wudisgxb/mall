var fileParse = require('co-busboy');
var fs = require('fs');
var os = require('os');
var path = require('path');
var utilx = require('../lib/util');
const router = new (require('koa-router'))()



    var uploadDir = path.join(__dirname, '..', 'public', 'upload');

    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
    }

    var newFileName = (filename) => {
        var ret;
        do {
            var newfilename = `${utilx.randomNum(6)}-${filename}`;
            ret = path.join(uploadDir, newfilename);
        } while(fs.exists(ret));
        return {
            path: ret,
            url: `v3/upload/${newfilename}`
        };
    };

    router.post('/api/v3/upload', async function (ctx,next) {
        var parts = fileParse(ctx);
        var part;

        var ret = [];
        while (part = await parts) {
            if (!part.pipe) {
                continue;
            }
            var filename = newFileName(part.filename);
            console.log("filename.url:" + filename.url);
            var stream = fs.createWriteStream(filename.path);
            part.pipe(stream);
            ret.push({
                success: true,
                file_path: filename.url
            });
        }

        ctx.body = ret.length === 1 ? ret[0] : ret;
    })
    module.exports = router
