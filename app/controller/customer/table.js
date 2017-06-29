const db = require('../../db/mysql/index');
const Tables = db.models.Tables;
const ShoppingCart = db.models.ShoppingCarts;
const ApiResult = require('../../db/mongo/ApiResult')

module.exports = {
    async getUserTableById (ctx, next) {
        ctx.checkParams('id').notEmpty().isInt();

        if (ctx.errors) {
            ctx.body = ctx.errors;
            return;
        }

        let table = await Tables.findAll({
            where: {
                id: ctx.params.id
            }
        })
        if (table.length > 0) {
            if (table[0].status == 1) {
                let shoppingCart = await ShoppingCart.findById(ctx.params.id);

                if (shoppingCart == null) {
                    table.status = 0;
                    await table[0].save();
                    ctx.body = {
                        tableStatus: 0
                    }
                    return;
                }
            }

            ctx.body = {
                tableStatus: table[0].status
            }
        } else {
            ctx.body = new ApiResult(ApiResult.Result.SUCCESS, result, "桌号不存在")
        }
    },


}