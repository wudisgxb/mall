let db = require('../../db/mysql/index');
let sequelizex = require('../../lib/sequelizex.js');
let Promise = require('promise');
let smsVerification = db.models.smsVerification;
let zy = require('../../controller/smsManager/smsSend.js');
const ApiResult = require('../../db/mongo/ApiResult')

let util = require('util');


module.exports = {
    async updateUserSendByPhone (ctx, next) {

        ctx.checkParams('phone').notEmpty().isInt().toInt();

        if (ctx.errors) {
            ctx.body = ctx.errors;
            return;
        }

        let phone = ctx.params.phone; //手机号
        // const re = /^[0-9]+$/;
        // let a =  re.test(phone);
        let randomNum = parseInt(Math.random() * 8999 + 1000);
        let smsPromise = new Promise((resolve) => {
            zy.sendSms(
                phone,
                randomNum,
                function (err, data, mess) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(JSON.parse(data.body).reason);
                        console.log(JSON.parse(mess).reason);
                        resolve(JSON.parse(data.body));
                    }
                }
            );
        });

        let result = await smsPromise;
        let smsVerification = db.models.smsVerification;
        await smsVerification.destroy({
            where: {phone: phone}
        });

        if (result.result == "SUCCESS") {
            await smsVerification.create({
                phone: phone,
                date: new Date(),
                code: randomNum,
                tenantId: ctx.query.tenantId
            })
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, result)
    },
    async updateUserConfirmByPhoneOrCode (ctx, next) {
        ctx.checkParams('phone').notEmpty().isInt().toInt();
        ctx.checkParams('code').notEmpty().isInt().toInt();

        if (ctx.errors) {
            ctx.body = ctx.errors;
            return;
        }

        let phone = ctx.params.phone; //手机号
        let code = ctx.params.code; //验证码;
        let ret = await smsVerification.findAll({
            where: {
                tenantId: ctx.query.tenantId,
                phone: phone,
                code: code,
                date: {
                    $lt: new Date(),
                    $gt: new Date(new Date() - 5 * 60 * 1000)
                }
            }
        });

        if (ret.length == 0) {
            ctx.body = {
                result: "fail"
            }
        } else {
            ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
        }
    }
}