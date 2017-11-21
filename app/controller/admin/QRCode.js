const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const db = require('../../db/mysql/index');
const QRCode = db.models.QRCode;

const Tool = require('../../Tool/tool');

module.exports = {
    async getQRCodeUrl (ctx, next) {
        ctx.checkQuery('scene').notEmpty();
        ctx.checkQuery('merchant').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }

        let qrCode = await QRCode.findOne({
            where: {
                scene: ctx.query.scene,
                merchantName: ctx.query.merchant,
                enable:true
            },
            attributes :['id','url','numberOfScan']
        });
        
        if (qrCode == null) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, ctx.errors);
            return;
        }

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, qrCode);
        qrCode.numberOfScan = parseInt(qrCode.numberOfScan) + 1;
        await qrCode.save();
    },
}


