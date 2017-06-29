const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
const db = require('../../db/mysql/index');
let PaymentReqs = db.models.PaymentReqs;
let Tables = db.models.Tables;

module.exports = {
    async getAdminReceivablesInfo (ctx, next) {
        let result = [];
        let paymentReqs = await PaymentReqs.findAll({
            where: {
                isFinish: true,
                isInvalid: false,
                tenantId: ctx.query.tenantId
            }
        });
        let table;
        for (let i = 0; i < paymentReqs.length; i++) {
            result[i] = {};
            table = await Tables.findById(paymentReqs[i].tableId);
            result[i].tableName = table.name;
            result[i].trade_no = paymentReqs[i].trade_no;
            result[i].total_amount = paymentReqs[i].total_amount;
            result[i].actual_amount = paymentReqs[i].actual_amount;
            result[i].refund_amount = paymentReqs[i].refund_amount;
            result[i].refund_reason = paymentReqs[i].refund_reason;
            result[i].consignee = paymentReqs[i].consignee;//代售点
            result[i].time = paymentReqs[i].createdAt.format('yyyy-MM-dd hh:mm:ss');
            result[i].paymentMethod = '支付宝';
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, result);
    }

}