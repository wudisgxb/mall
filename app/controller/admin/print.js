const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
let Prints = db.models.Prints;

module.exports = {

    async saveAdminPrint (ctx, next) {
        ctx.checkBody('/printerSetting/deviceName', true).first().notEmpty();
        ctx.checkBody('/printerSetting/printType', true).first().notEmpty();
        ctx.checkBody('/printerSetting/printTime', true).first().notEmpty();
        ctx.checkBody('/printerSetting/isNeedCustomSmallTicketHeader', true).first().notEmpty();
        ctx.checkBody('/printerSetting/smallTicketNum', true).first().notEmpty();
        ctx.checkBody('/printerSetting/isShowMoney', true).first().notEmpty();
        ctx.checkBody('/printerSetting/connectMode', true).first().notEmpty();
        ctx.checkBody('tenantId').notEmpty();
        ctx.checkBody('/printerSetting/printName',true).notEmpty();

        let body = ctx.request.body;

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }
        let prints = await Prints.findAll({
            where: {
                printName: body.printerSetting.printName,
                tenantId: body.tenantId
            }
        })
        if (prints.length > 0) {
            ctx.body = new ApiResult(ApiResult.Result.EXISTED, "打印机名已存在");
            return;
        }

        await Prints.create({
            printName: body.printerSetting.printName,
            deviceName: body.printerSetting.deviceName,
            printType: body.printerSetting.printType,
            printTime: body.printerSetting.printTime,
            isNeedCustomSmallTicketHeader: body.printerSetting.isNeedCustomSmallTicketHeader,
            customSmallTicketHeader: body.printerSetting.customSmallTicketHeader || "",
            smallTicketNum: body.printerSetting.smallTicketNum,
            isShowMoney: body.printerSetting.isShowMoney,
            connectMode: body.printerSetting.connectMode,
            tenantId: body.tenantId,
        });
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },

    async updateAdminPrintById (ctx, next) {
        ctx.checkBody('/printerSetting/deviceName', true).first().notEmpty();
        ctx.checkBody('/printerSetting/printType', true).first().notEmpty();
        ctx.checkBody('/printerSetting/printTime', true).first().notEmpty();
        ctx.checkBody('/printerSetting/isNeedCustomSmallTicketHeader', true).first().notEmpty();
        ctx.checkBody('/printerSetting/smallTicketNum', true).first().notEmpty();
        ctx.checkBody('/printerSetting/isShowMoney', true).first().notEmpty();
        ctx.checkBody('/printerSetting/connectMode', true).first().notEmpty();
        ctx.checkBody('/printerSetting/printName', true).first().notEmpty();

        ctx.checkBody('/condition/tenantId', true).first().notEmpty();
        ctx.checkBody('/condition/id', true).first().notEmpty();
        let body = ctx.request.body;

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }
        let print = await Prints.findOne({
            where: {
                id: body.condition.id,
                tenantId: body.condition.tenantId
            }
        });
        if (print != null) {
            print.printName = body.printerSetting.printName;
            print.deviceName = body.printerSetting.deviceName;
            print.printType = body.printerSetting.printType;
            print.printTime = body.printerSetting.printTime;
            print.isNeedCustomSmallTicketHeader = body.printerSetting.isNeedCustomSmallTicketHeader;
            print.customSmallTicketHeader = body.printerSetting.customSmallTicketHeader || "";
            print.smallTicketNum = body.printerSetting.smallTicketNum;
            print.isShowMoney = body.printerSetting.isShowMoney;
            print.connectMode = body.printerSetting.connectMode;
            print.tenantId = body.condition.tenantId;

            await print.save();
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },

    async getAdminPrint (ctx, next) {
        // ctx.checkQuery('deviceName').notEmpty();
        // ctx.checkQuery('connectMode').notEmpty();
        // ctx.checkQuery('printTime').notEmpty();
        // if(ctx.errors){
        //     ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors );
        //     return;
        // }
        let deviceName = ctx.query.deviceName;
        let connectMode = ctx.query.connectMode;
        let printTime = ctx.query.printTime;
        let keys = ['id', 'printName', 'deviceName', 'printType', 'printTime', 'isNeedCustomSmallTicketHeader', 'customSmallTicketHeader', 'smallTicketNum', 'isShowMoney', 'connectMode', 'tenantId'];
        const condition = await keys.reduce((accu, curr) => {
            if (ctx.query[curr]) {
                accu[curr] = ctx.query[curr]
            }
            return accu;
        }, {})

        let prints = await Prints.findAll({
            where: condition
        });
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, prints);
    },

    async deleteAdminPrint(ctx, next){
        ctx.checkQuery('id').notEmpty();
        ctx.checkQuery('tenantId').notEmpty();
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }
        let id = ctx.query.id;
        let tenantId = ctx.query.tenantId;
        let keys = ['id', 'printName', 'deviceName', 'printType', 'printTime', 'isNeedCustomSmallTicketHeader', 'customSmallTicketHeader', 'smallTicketNum', 'isShowMoney', 'printModel', 'tenantId'];
        const condition = await keys.reduce((accu, curr) => {
            if (ctx.query[curr]) {
                accu[curr] = ctx.query[curr]
            }
            return accu;
        }, {})
        let prints = await Prints.findAll({
            where: condition
        });

        if (prints == null || prints.length == 0) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, '打印机不存在！');
            return;
        }

        await prints.reduce(async(accu, print) => {
            await print.destroy();
            return accu;
        }, {})

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS);
    }

}