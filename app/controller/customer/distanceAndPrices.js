const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
const db = require('../../db/mysql/index');
const DistanceAndPrices = db.models.DistanceAndPrices;
const Tool = require('../../Tool/tool');

module.exports = {
    //根据距离获取配送费
    async getDeliveryFee (ctx, next) {
        ctx.checkQuery('distance').notEmpty();
        ctx.checkQuery('tenantId').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }

        let distanceAndPrices = await DistanceAndPrices.findOne({
            where: {
                minDistance: {
                    $lte: ctx.query.distance
                },
                maxDistance: {
                    $gte: ctx.query.distance
                },
                tenantId: ctx.query.tenantId
            }
        });

        if (distanceAndPrices == null) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "配送费未算出！");
            return;
        }

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, {
            "deliveryFeeId": distanceAndPrices.deliveryFeeId,
            "deliveryFeeValue": distanceAndPrices.deliveryFee,
            "startPrice": distanceAndPrices.startPrice,
            "deliveryTime": distanceAndPrices.deliveryTime
        });
    },
}