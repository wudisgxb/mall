/**
 * Created by bian on 12/3/15.
 */
const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
let db = require('../../db/mysql/index');
let Tool = require('../../Tool/tool')
let Captcha = db.models.Captcha
let Admins = db.models.Adminer
let Caap = require('ccap')();
let http = require('http')
let auth = require('../auth/auth')


module.exports = {

    async getAdminLoginUser(ctx, next){
        let admin = await auth.getAdminLoginUsers();
        // console.log(admin)
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,admin)
        // //if (request.url == '/favicon.ico')return response.end('');
        // //实例化caap包
        // let ary = Caap.get();
        // //获取当前时间
        // let date = new Date().format("yyyyMMddhhmmssS");
        // //ary中喊随机数，和验证码图片
        // let txt = ary[0];
        // let buf = ary[1];
        // //用当前时间和随机数拼接一个唯一的建
        // let key = date + txt;
        // //将唯一的键和随机数存入数据库
        // await Captcha.create({
        //     key: key,
        //     captcha: txt
        // });
        // //返回唯一的键，随机数，和图形验证码给前台
        // ctx.body = new ApiResult(ApiResult.Result.SUCCESS, {
        //     "key": key,
        //     "number": txt,
        //     "buf": buf.toString('base64')
        // });
    },

    async getadminLong(ctx, next){
        ctx.checkBody('userName').notEmpty();
        ctx.checkBody('password').notEmpty();
        //ctx.checkBody('captcha').notEmpty();
        //ctx.checkBody('key').notEmpty();
        let body = ctx.request.body;
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, ctx.errors);
            return;
        }
        //根据key查询Captcha中的记录
        if(body.captcha!=null){
            if(body.captcha==""){
                ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "验证码不能为空")
                return;
            }
            let captcha = await Captcha.findOne({
                where: {
                    key: body.key,
                }
            })
            //根据现在的时间减去创建的时间-创建时间如果大于5分钟
            if ((new Date() - captcha.createdAt) > 5 * 1000 * 60) {
                //将验证码超时，请重新获取传给前端，并跳出
                ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "验证码超时，请重新获取");
                return;
            }
            if (body.captcha.toLowerCase() != captcha.captcha.toLowerCase()) {
                ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "图形验证码错误")
                return;
            }
        }
        let whereJson = {
            nickname: body.userName,
            password: body.password
        }
        let admin = await auth.getadmin(whereJson)
        //如果匹配查询用户名密码是否正确

            //判断查询的记录数是否等于0
        if (admin == null) {
            //如果等于0那么就返回给前台用户名密码错误
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "用户名密码错误")
            return;
        } else {
            let correspondingJson = {
                phone : admin.phone
            }
            let adminCorresponding = await auth.getadminCorresponding(correspondingJson)
            ctx.body = new ApiResult(ApiResult.Result.SUCCESS, {
                correspondingId: adminCorresponding.correspondingId,
                tenantId : adminCorresponding.correspondingId,
                correspondingType : adminCorresponding.correspondingType,
                style :admin.style,
                name : admin.nickname,
            })
        }
    },

}