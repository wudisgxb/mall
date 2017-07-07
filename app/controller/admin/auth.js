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


module.exports = {

    async getAdminLoginUser(ctx, next){
        //if (request.url == '/favicon.ico')return response.end('');
        let ary = Caap.get();
        let date = new Date().format("yyyyMMddhhmmssS");
        let txt = ary[0];
        let buf = ary[1];
        let key = date + txt;
        let buffer = buf.toString('base64');
        let auth = [];
        auth.push(key)
        auth.push(buffer)

        await Captcha.create({
                key:key,
                captcha:txt
        });
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, {
            "key":key,
            "number":txt,
            "buf":buf.toString('base64')
        });
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,auth)
    },

    async getadminLong(ctx, next){
        ctx.checkBody('nickname').notEmpty();
        ctx.checkBody('password').notEmpty();
        ctx.checkBody('captcha').notEmpty();
        ctx.checkBody('key').notEmpty();

        let body = ctx.request.body;
        if (this.errors) {
            ctx.body=new ApiResult(ApiResult.Result.NOT_FOUND,this.errors);
            return;
        }
        let captcha =await Captcha.findOne({
            where:{
                key : body.key
            }
        })
        if(captcha==null){
            ctx.body=new ApiResult(ApiResult.Result.NOT_FOUND,"验证码超时，请重新获取" );
        }
        let c;
        if(body.captcha.toLowerCase()==captcha.captcha.toLowerCase()){
            c = await Admins.findAll({
                where: {
                    nickname: body.nickname,
                    password: body.password
                }
            });
            if (c.length == null) {
                ///登陆
                ctx.body =  new ApiResult(ApiResult.Result.NOT_FOUND,"用户名密码错误")
            }
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,c)
    }
}