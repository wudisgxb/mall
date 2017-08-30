const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
let db = require('../../db/mysql/index');
let MerchantRatings = db.models.MerchantRatings
let Ratings = db.models.Ratings;

module.exports = {
    async getCustomerMerchantByTenantId(ctx, next){
        ctx.checkQuery('tenantId').notEmpty();
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, ctx.errors);
            return;
        }
        let merchantRatings = await MerchantRatings.findAll({
            where: {
                tenantId: ctx.query.tenantId,
                consigneeId: null
            }
        });
        if (merchantRatings.length == 0) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "没有任何评价");
            return;
        }
        for (let i = 0; i < merchantRatings.length; i++) {
            merchantRatings[i].userName = merchantRatings[i].userName.slice(0, 3) + '****' + merchantRatings[i].userName.slice(-4);
        }

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, merchantRatings);
    },

    async getCustomerMerchantByConsigneeId(ctx, next){
        ctx.checkQuery('consigneeId').notEmpty();
        ctx.checkQuery('tenantId').notEmpty();
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, ctx.errors);
            return;
        }
        let merchantRatings = await MerchantRatings.findAll({
            where: {
                tenantId: ctx.query.tenantId,
                consigneeId: ctx.query.consigneeId
            }
        });
        if (merchantRatings.length == 0) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "没有任何评价");
            return;
        }
        for (let i = 0; i < merchantRatings.length; i++) {
            merchantRatings[i].userName = merchantRatings[i].userName.slice(0, 3) + '****' + merchantRatings[i].userName.slice(-4);
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, merchantRatings);
    },

    async saveCustomerMerchantByTenantId(ctx, next){
        ctx.checkBody('phoneNumber').notEmpty();
        ctx.checkBody('comment').notEmpty();
        ctx.checkBody('tenantId').notEmpty();
        ctx.checkBody('tasteScore').notEmpty();
        ctx.checkBody('serviceScore').notEmpty();
        ctx.checkBody('environmentScore').notEmpty();
        let body = ctx.request.body;

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, ctx.errors);
            return;
        }
        let totalScore = parseInt(body.tasteScore) + parseInt(body.environmentScore) + parseInt(body.serviceScore);
        let averageScore = Math.round(totalScore / 3 * 10) / 10;
        await MerchantRatings.create({
            userName: body.phoneNumber,
            text: body.comment,
            avatar: "http://static.galileo.xiaojukeji.com/static/tms/default_header.png",
            tenantId: body.tenantId,
            tasteScore: body.tasteScore,
            serviceScore: body.serviceScore,
            environmentScore: body.environmentScore,
            averageScore: averageScore
        })
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS);
    },

    async saveCustomerMerchantByConsigneeId(ctx, next){
        ctx.checkBody('phoneNumber').notEmpty();
        ctx.checkBody('comment').notEmpty();
        ctx.checkBody('tenantId').notEmpty();
        ctx.checkBody('consigneeId').notEmpty();
        ctx.checkBody('tasteScore').notEmpty();
        ctx.checkBody('serviceScore').notEmpty();
        ctx.checkBody('environmentScore').notEmpty();
        let body = ctx.request.body;

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, ctx.errors);
            return;
        }
        let totalScore = parseInt(body.tasteScore) + parseInt(body.environmentScore) + parseInt(body.serviceScore);
        let averageScore = Math.round(totalScore / 3 * 10) / 10;
        await MerchantRatings.create({
            userName: body.phoneNumber,
            text: body.comment,
            tenantId: body.tenantId,
            avatar: "http://static.galileo.xiaojukeji.com/static/tms/default_header.png",
            tasteScore: body.tasteScore,
            serviceScore: body.serviceScore,
            consigneeId: body.consigneeId,
            environmentScore: body.environmentScore,
            averageScore: averageScore
        })
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS);
    },

    async saveCustomerFoodByTenantId(ctx, next){
        ctx.checkBody('phoneNumber').notEmpty();
        ctx.checkBody('comment').notEmpty();
        ctx.checkBody('foodId').notEmpty();
        ctx.checkBody('tenantId').notEmpty();
        let body = ctx.request.body;

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, ctx.errors);
            return;
        }
        await Ratings.create({
            username: body.phoneNumber,
            text: body.comment,
            avatar: "http://static.galileo.xiaojukeji.com/static/tms/default_header.png",
            tenantId: body.tenantId,
            foodId: body.foodId
        })
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS);
    },

    async saveCustomerFoodByConsigneeId(ctx, next){
        ctx.checkBody('phoneNumber').notEmpty();
        ctx.checkBody('comment').notEmpty();
        ctx.checkBody('tenantId').notEmpty();
        ctx.checkBody('consigneeId').notEmpty();
        ctx.checkBody('foodId').notEmpty();
        let body = ctx.request.body;

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, ctx.errors);
            return;
        }
        await Ratings.create({
            username: body.phoneNumber,
            text: body.comment,
            tenantId: body.tenantId,
            avatar: "http://static.galileo.xiaojukeji.com/static/tms/default_header.png",
            foodId: body.foodId,
            consigneeId: body.consigneeId
        })
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS);
    },
}

