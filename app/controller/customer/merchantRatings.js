const db = require('../../db/mysql/index');
const sequelizex = require('../../lib/sequelizex.js');

const MerchantRatings = db.models.MerchantRatings;
const ApiResult = require('../../db/mongo/ApiResult')


module.exports = {
    async saveUserMerchantRatings (ctx, next) {

        ctx.checkBody('userName').notEmpty();
        //ctx.checkBody('rateTime').notEmpty();
        ctx.checkBody('text').notEmpty();
        //ctx.checkBody('avatar').notEmpty();
        ctx.checkBody('tenantId').notEmpty();
        ctx.checkBody('tasteScore').notEmpty();
        ctx.checkBody('environmentScore').notEmpty();
        ctx.checkBody('serviceScore').notEmpty();
        let body = ctx.request.body;
        if (ctx.errors) {
            ctx.body = ctx.errors;
            return;
        }
        let totalScore = parseInt(body.tasteScore) + parseInt(body.environmentScore) + parseInt(body.serviceScore);
        let averageScore = Math.round(totalScore / 3 * 10) / 10;
        await MerchantRatings.create({
            userName: body.userName,
            rateTime: new Date(),
            text: body.text,
            avatar: "http://static.galileo.xiaojukeji.com/static/tms/default_header.png",
            tenantId: body.tenantId,
            tasteScore: body.tasteScore,
            environmentScore: body.environmentScore,
            serviceScore: body.serviceScore,
            averageScore: averageScore
        });
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)

    },

    async getusermerchantRatings (ctx, next) {
        let merchantRatings = await MerchantRatings.findAll({
            where: {
                'tenantId': ctx.query.tenantId
            }
        });

        for (let i = 0; i < merchantRatings.length; i++) {
            merchantRatings[i].userName = merchantRatings[i].userName.slice(0, 3) + '****' + merchantRatings[i].userName.slice(-4);
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, merchantRatings);
    },

}