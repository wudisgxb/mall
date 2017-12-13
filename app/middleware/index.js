/**
 * Created by Thinkpad on 2017/3/19.
 */
const convert = require('koa-convert')
const json = require('koa-json')
const koaBody = require('koa-body')
const cors = require('koa-cors')

const static = require('koa-static')
const jwt = require('koa-jwt')

const log4js = require('koa-log4')
require('../../log') //引入（运行）日志配置文件， 生产日志目录及相应文件
const logger = log4js.getLogger('app')

const timeCost = require('./timeCost')
const path = require('path')
const ApiError = require('../db/mongo/ApiError')

module.exports = function (app) {
    app.use(async(ctx, next) => {
        try {
            console.log(444)
            await next()
        } catch (err) {
            console.log(555)
            if (err.status === 401) {
                ctx.status = 401
                ctx.body = 'Protected resource, use Authorization header to get access; Format is "Authorization: Bearer <token>"\n'
            } else {
                ctx.status = err.status || 500
                if (err instanceof ApiError) {
                    ctx.body = err
                } else {
                    ctx.body = '您的服务器报500错误'
                }
                ctx.app.emit('error', err, ctx)
            }
        }
    })
    console.log(333)
    //xml
    var xmlParser = require('koa-xml-body'); // note the default
    app.use(xmlParser());

    app.use(async function(ctx,next) {
        // the parsed body will store in this.request.body
        // if nothing was parsed, body will be undefined
        ctx.xmlBody = ctx.request.body;
        await next();
    });

    app.use(log4js.koaLogger(log4js.getLogger('http'), {level: 'auto'}))

    app.use(koaBody({
        multipart: true,
        formidable: {
            uploadDir: path.join(__dirname, '..', 'public')
        }
    }))

    require('koa-validate')(app);

    app.use(convert(cors({
        credentials : true
    })))
    app.use(convert(json()))

    app.use(jwt({secret: require('../config/config').jwtSecret}).unless({ path: [/login|register|upload|(api\/test\/customer)|wechatPayNotify|alipay/i] }))

    app.use(timeCost())

    app.use(convert(static(path.join(__dirname,'../public')
    )))

    // errorHandler
    app.on('error', function (err, ctx) {
        logger.error('server error', err, ctx)
    })


}
