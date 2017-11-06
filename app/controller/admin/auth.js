/**
 * Created by bian on 12/3/15.
 */
const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const ApiLoginResult = require('../../db/mongo/ApiLoginResult')
const jsonwebtoken = require('jsonwebtoken')
let db = require('../../db/mysql/index');
let Tool = require('../../Tool/tool')
let Captcha = db.models.Captcha
const AllianceMerchants = db.models.AllianceMerchants;
const Merchants = db.models.Merchants
const Alliances = db.models.Alliances
let Admins = db.models.Adminer
let Caap = require('ccap')();
let http = require('http')
let auth = require('../auth/auth')
const sqlAllianceMerchants = require('../businessAlliance/allianceMerchants')
const sqlHeadquarters = require('../businessAlliance/headquarters')
const headQuarters = require('../businessAlliance/headquarters')
const jwtSecret = require('../../config/config').jwtSecret
// console.log(jwtSecret)
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
                ctx.body = new ApiLoginResult(ApiLoginResult.Result.CAPTCHA_ERROR)
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
                ctx.body = new ApiLoginResult(ApiLoginResult.Result.CAPTCHA_TIMEOUT)
                return;
            }
            if (body.captcha.toLowerCase() != captcha.captcha.toLowerCase()) {
                ctx.body = new ApiLoginResult(ApiLoginResult.Result.CAPTCHA_ERROR)
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
            ctx.body = new ApiLoginResult(ApiLoginResult.Result.NOT_MATCH)
            return;
        } else {
            let correspondingJson = {
                phone : admin.phone
            }

            let adminCorresponding = await auth.getadminCorresponding(correspondingJson)
            // const token = jsonwebtoken.sign({phone: admin.phone}, jwtSecret, {expiresIn: 5 * 60})
            // console.log(token)
            if(adminCorresponding.correspondingType==3){
                let tenantJson = {
                    tenantId : adminCorresponding.correspondingId
                }
                let getOperation = await sqlAllianceMerchants.getOperation(AllianceMerchants,tenantJson)
                ctx.body = new ApiResult(ApiResult.Result.SUCCESS, {
                    alliancesId : getOperation==null?"":getOperation.alliancesId,
                    tenantId : adminCorresponding.correspondingId,
                    correspondingType : adminCorresponding.correspondingType,
                    style :admin.style,
                    name : admin.nickname,
                    token
                })
            }
            if(adminCorresponding.correspondingType==2){
                let alliancesJson = {
                    alliancesId:adminCorresponding.correspondingId
                }
                let getHeadquarter = await sqlHeadquarters.getHeadquarter(alliancesJson);
                ctx.body = new ApiResult(ApiResult.Result.SUCCESS, {
                    alliancesId : adminCorresponding.correspondingId,
                    headquartersId : getHeadquarter.headquartersId,
                    correspondingType : adminCorresponding.correspondingType,
                    style :admin.style,
                    name : admin.nickname,
                    token
                })
            }
            if(adminCorresponding.correspondingType==1){
                // let headquarterJson = {
                //     headquartersId: adminCorresponding.correspondingId
                // }
                // let getHeadquarter = await headQuarters.getHeadquarter(headquarterJson)
                ctx.body = new ApiResult(ApiResult.Result.SUCCESS, {
                    headquartersId : adminCorresponding.correspondingId,
                    correspondingType : adminCorresponding.correspondingType,
                    style :admin.style,
                    name : admin.nickname,
                    token
                })
            }
        }
    },

}