const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
let Tables = db.models.Tables;

module.exports = {

    async saveAdminTable (ctx, next) {
        ctx.checkBody('name').notEmpty();
        ctx.checkBody('info').notEmpty();

        let body = ctx.request.body;

        if (ctx.errors) {
            ctx.body = ctx.errors;
            return;
        }
        let isCreate = true;
        if (isCreate) {
            let tables = await Tables.findAll({
                where: {
                    name: body.name
                }
            })
            if (tables.length > 0) {
                ctx.body = {
                    resCode: -1,
                    result: "桌号已存在！"
                }
                return;
            }

            await Tables.create({
                name: body.name,
                status: 0,
                info: body.info,
                tenantId: ctx.query.tenantId
                // todo: ok?
                //deletedAt: Date.now()
            });
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },
    async updateAdminTableById (ctx, next) {
        ctx.checkBody('name').notEmpty();
        //ctx.checkBody('status').notEmpty().isInt().ge(0).toInt();
        ctx.checkBody('info').notEmpty();

        let body = ctx.request.body;

        if (ctx.errors) {
            ctx.body = ctx.errors;
            return;
        }


        let isCreate = true;
        let table;
        if (ctx.params.id) {
            table = await Tables.findById(ctx.params.id);
            if (table != null) {
                table.name = body.name;
                table.status = 0;
                table.info = body.info;

                await table.save();

                isCreate = false;
            }
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },

    async getAdminTableByTableName (ctx, next) {
        ctx.checkQuery('tenantId', true).notEmpty();
        ctx.checkQuery('tableName',true).notEmpty();
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors );
        }
        let table = await Tables.findAll({
            where: {
                tenantId: ctx.query.tenantId,
                name:ctx.query.tableName
            },
            attributes: {
                exclude: ['createdAt', 'updatedAt']
            }
        })
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, table);
    },
    async getAdminTableByConsigneeId (ctx, next) {
        ctx.checkQuery('tenantId', true).notEmpty();
        ctx.checkQuery('tableName',true).notEmpty();
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors );
        }
        let table = await Tables.findAll({
            where: {
                tenantId: ctx.query.tenantId,
                name:ctx.query.tableName
            },
            attributes: {
                exclude: ['createdAt', 'updatedAt']
            }
        })
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, table);
    },




    async deleteAdminTable(ctx, next){
        ctx.checkParams('id').notEmpty().isInt().toInt();
        let table = await Tables.findById(ctx.params.id);
        await table.destroy();
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS);
    }

}