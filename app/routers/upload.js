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
    } while (fs.exists(ret));
    return {
        path: ret,
        url: `test/upload/${newfilename}`
    };
};

router.post('/api/test/upload', async function (ctx, next) {
    const file = ctx.request.body.files.file;

    const reader = fs.createReadStream(file.path);
    console.log("filename:" + file.name)
    console.log("filepath:" + file.path)
    const filename = newFileName(file.name);
    const stream = fs.createWriteStream(filename.path);
    reader.pipe(stream);
    console.log('uploading %s -> %s', file.name, stream.path);

    ctx.body = {
        success: true,
        file_path: filename.url.replace(/http:/, "https:")
    };
});
module.exports = router