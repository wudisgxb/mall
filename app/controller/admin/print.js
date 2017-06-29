const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
let Prints = db.models.Prints;

module.exports = {

    async saveAdminPrint (ctx, next) {
        ctx.checkBody('printName').notEmpty();
        ctx.checkBody('deviceName').notEmpty();
        ctx.checkBody('printType').notEmpty();
        ctx.checkBody('printTime').notEmpty();
        ctx.checkBody('isNeedCustomSmallTicketHeader').notEmpty();
        ctx.checkBody('smallTicketNum').notEmpty().isInt().ge(0).toInt();
        ctx.checkBody('isShowMoney').notEmpty();
        ctx.checkBody('printModel').notEmpty();
        ctx.checkBody('tenantId').notEmpty();

        let body = ctx.request.body;

        if (ctx.errors) {
            ctx.body = ctx.errors;
            return;
        }

        let prints = await Prints.findAll({
            where: {
                printName: body.printName,
                tenantId: body.tenantId
            }
        })
        if (prints.length > 0) {
            ctx.body = {
                resCode: -1,
                result: "打印机名已存在！"
            }
            return;
        }

        await Prints.create({
            printName: body.printName,
            deviceName: body.deviceName,
            printType: body.printType,
            printTime: body.printTime,
            isNeedCustomSmallTicketHeader: body.isNeedCustomSmallTicketHeader,
            customSmallTicketHeader: body.customSmallTicketHeader || "",
            smallTicketNum: body.smallTicketNum,
            isShowMoney: body.isShowMoney,
            printModel: body.printModel,
            tenantId: body.tenantId,
        });
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },
    async updateAdminPrintById (ctx, next) {
        ctx.checkBody('printName').notEmpty();
        ctx.checkBody('deviceName').notEmpty();
        ctx.checkBody('printType').notEmpty();
        ctx.checkBody('printTime').notEmpty();
        ctx.checkBody('isNeedCustomSmallTicketHeader').notEmpty();
        ctx.checkBody('smallTicketNum').notEmpty().isInt().ge(0).toInt();
        ctx.checkBody('isShowMoney').notEmpty();
        ctx.checkBody('printModel').notEmpty();
        ctx.checkBody('tenantId').notEmpty();

        let body = ctx.request.body;

        if (ctx.errors) {
            ctx.body = ctx.errors;
            return;
        }
        let print = await Prints.findById(ctx.params.id);
        if (print != null) {
            print.printName = body.printName;
            print.deviceName = body.deviceName;
            print.printType = body.printType;
            print.printTime = body.printTime;
            print.isNeedCustomSmallTicketHeader = body.isNeedCustomSmallTicketHeader;
            print.customSmallTicketHeader = body.customSmallTicketHeader || "",
                print.smallTicketNum = body.smallTicketNum;
            print.isShowMoney = body.isShowMoney;
            print.printModel = body.printModel;
            print.tenantId = body.tenantId;

            await print.save();
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },
    async getAdminPrint (ctx, next) {
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
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, prints);
    },
    async deleteAdminPrint(ctx, next){
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
            ctx.body = {
                resCode: 0,
                result: "打印机不存在！"
            };
            return;
        }

        await prints.reduce(async(accu, print) => {
            await print.destroy();
            return accu;
        }, {})

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS);
    }

}