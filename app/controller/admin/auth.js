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
        //实例化caap包
        let ary = Caap.get();
        //获取当前时间
        let date = new Date().format("yyyyMMddhhmmssS");
        //ary中喊随机数，和验证码图片
        let txt = ary[0];
        let buf = ary[1];
        //用当前时间和随机数拼接一个唯一的建
        let key = date + txt;
        //将唯一的键和随机数存入数据库
        await Captcha.create({
                key:key,
                captcha:txt
        });
        //返回唯一的键，随机数，和图形验证码给前台
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, {
            "key":key,
            "number":txt,
            "buf":buf.toString('base64')
        });
    },
    async getadminLong(ctx, next){
        ctx.checkBody('userName').notEmpty();
        ctx.checkBody('password').notEmpty();
        ctx.checkBody('captcha').notEmpty();
        ctx.checkBody('key').notEmpty();
        let body = ctx.request.body;
        if (this.errors) {
            ctx.body=new ApiResult(ApiResult.Result.NOT_FOUND,this.errors);
            return;
        }
        //根据key查询Captcha中的记录
        let captcha =await Captcha.findOne({
            where:{
                key : body.key,
            }
        })
        //根据现在的时间减去创建的时间-创建时间如果大于5分钟
        if((new Date()-captcha.createdAt)>5*1000*60){
            //将验证码超时，请重新获取传给前端，并跳出
            ctx.body=new ApiResult(ApiResult.Result.NOT_FOUND,"验证码超时，请重新获取" );
            return;
        }
        let c;
        //判断输入的验证码和数据库中的验证码是否匹配
        if(body.captcha.toLowerCase()==captcha.captcha.toLowerCase()){
            //如果匹配查询用户名密码是否正确
            c =await Admins.findOne({
                where:{
                    nickname:body.userName,
                    password:body.password
                }
            })
            //判断查询的记录数是否等于0
            if(c==null){
                //如果等于0那么就返回给前台用户名密码错误
                ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"用户名密码错误")
                return;
            }else{
                //用户名密码正确返回租户Id给前端
                ctx.body= new ApiResult(ApiResult.Result.SUCCESS,{
                    id:c.id,
                    tenantId:c.tenantId
                })
                return;
            }
        }
         else {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"图形验证码错误！请重新输入！")
            return;
        }

    }
}