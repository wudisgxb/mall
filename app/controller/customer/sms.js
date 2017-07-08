let db = require('../../db/mysql/index');
let sequelizex = require('../../lib/sequelizex.js');
let Promise = require('promise');
let smsVerification = db.models.smsVerification;
let zy = require('../../controller/smsManager/smsSend.js');
const ApiResult = require('../../db/mongo/ApiResult')

let util = require('util');


module.exports = {
    async getDealSmscode (ctx, next) {
        ctx.checkQuery('phoneNumber').notEmpty().isInt().toInt();
        ctx.checkQuery('tenantId').notEmpty()

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }

        let phone = ctx.query.phoneNumber; //手机号
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

    async getEshopSmscode (ctx, next) {
        ctx.checkQuery('phoneNumber').notEmpty().isInt().toInt();
        ctx.checkQuery('tenantId').notEmpty();
        ctx.checkQuery('consigneeId').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }

        let phone = ctx.query.phoneNumber; //手机号
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
                tenantId: ctx.query.tenantId,
                consigneeId: ctx.query.consigneeId
            })
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, result)
    },

    async dealVerifyCode (ctx, next) {
        ctx.checkBody('phoneNumber').notEmpty();
        ctx.checkBody('verifyCode').notEmpty().isInt().toInt();
        ctx.checkBody('tenantId').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }

        let phone = ctx.request.body.phoneNumber; //手机号
        let code = ctx.request.body.verifyCode; //验证码;
        let ret = await smsVerification.findAll({
            where: {
                tenantId: ctx.request.body.tenantId,
                consigneeId: null,
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
    },

    async eshopVerifyCode (ctx, next) {
        ctx.checkBody('phoneNumber').notEmpty();
        ctx.checkBody('verifyCode').notEmpty().isInt().toInt();
        ctx.checkBody('tenantId').notEmpty();
        ctx.checkBody('consigneeId').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }

        let phone = ctx.request.body.phoneNumber; //手机号
        let code = ctx.request.body.verifyCode; //验证码;
        let ret = await smsVerification.findAll({
            where: {
                tenantId: ctx.request.body.tenantId,
                consigneeId: ctx.request.body.consigneeId,
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