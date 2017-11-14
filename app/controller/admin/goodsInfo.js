const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
const Promise = require('Promise')
let db = require('../../db/mysql/index');
let GoodsInfos = db.models.GoodsInfos;
let Foods = db.models.Foods;
let Menus = db.models.Menus;
let FoodsOfTMenus = db.models.FoodsOfTMenus

module.exports = {

    async saveAdminGoodsInfo (ctx, next) {
        ctx.checkBody('/goodsInfo/name', true).first().notEmpty();
        ctx.checkBody('/goodsInfo/property', true).first().notEmpty();
        ctx.checkBody('/goodsInfo/unit', true).first().notEmpty();
        ctx.checkBody('/goodsInfo/unitPrice', true).first().notEmpty();
        ctx.checkBody('/goodsInfo/isActive', true).first().notEmpty();
        ctx.checkBody('/goodsInfo/info', true).first().notEmpty();
        ctx.checkBody('tenantId').notEmpty();


        let body = ctx.request.body;

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }
        //生成商品编号
        let goodsNumber = new Date().format("yyyyMMddhhmmssS") + parseInt(Math.random() * 8999 + 1000)

        let goodsInfos = await GoodsInfos.findAll({
            where: {
                name: body.goodsInfo.name,
                property: body.goodsInfo.property,
                unit: body.goodsInfo.unit,
                tenantId: body.tenantId
            }
        })
        if (goodsInfos.length > 0) {
            ctx.body = new ApiResult(ApiResult.Result.EXISTED, "商品属性，名称，单位不能完全重复！");
            return;
        }

        await GoodsInfos.create({
            name: body.goodsInfo.name,
            goodsNumber: goodsNumber,
            property: body.goodsInfo.property,
            unit: body.goodsInfo.unit,
            unitPrice: body.goodsInfo.unitPrice,
            isActive: body.goodsInfo.isActive,
            info: body.goodsInfo.info,
            tenantId: body.tenantId,
        });
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,goodsNumber)
    },

    // async saveGoodsInfo (ctx, next) {
    //     // console.log(GoodsInfos)
    //     // let goods = await GoodsInfos.findAll({})
    //     // goods.destroy()
    //     let food = await Foods.findAll({})
    //     let FoodArray = []
    //     let tasks = []
    //     for(let f of food){
    //         let fm = await FoodsOfTMenus.findOne({
    //             where:{
    //                 FoodId : f.id,
    //                 tenantId : f.tenantId
    //             }
    //         })
    //         let menu
    //
    //
    //             menu = await Menus.findOne({
    //                 where:{
    //                     tenantId : f.tenantId,
    //                     id : fm.MenuId
    //                 }
    //             })
    //
    //         let goodsNumber = new Date().getTime()+parseInt(Math.random()*8999+1000)
    //
    //         console.log(f.name)
    //         console.log(menu.name)
    //         console.log(goodsNumber)
    //         console.log(f.unit)
    //         console.log(f.constPrice)
    //         console.log(0)
    //         console.log(f.tenantId)
    //         console.log(f.info)
    //
    //         tasks.push(GoodsInfos.create({
    //
    //             name : f.name,
    //             property : menu.name,
    //             goodsNumber : goodsNumber,
    //             unit :f.unit,
    //             unitPrice : f.constPrice==null?0:f.constPrice,
    //             isActive : 0,
    //             tenantId : f.tenantId,
    //             info : f.info,
    //
    //         }))
    //     }
    //     await Promise.all(tasks)
    //
    //     ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    // },

    async updateAdminGoodsInfo (ctx, next) {
        ctx.checkBody('/goodsInfo/name', true).first().notEmpty();
        ctx.checkBody('/goodsInfo/property', true).first().notEmpty();
        ctx.checkBody('/goodsInfo/unit', true).first().notEmpty();
        ctx.checkBody('/goodsInfo/unitPrice', true).first().notEmpty();
        ctx.checkBody('/goodsInfo/isActive', true).first().notEmpty();
        ctx.checkBody('/goodsInfo/info', true).first().notEmpty();
        ctx.checkBody('/condition/tenantId', true).first().notEmpty();
        ctx.checkBody('/condition/id', true).first().notEmpty();
        let body = ctx.request.body;

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }
        let goodsInfo = await GoodsInfos.findOne({
            where: {
                id: body.condition.id,
                tenantId: body.condition.tenantId
            }
        });
        if (goodsInfo != null) {
            goodsInfo.name = body.goodsInfo.name;
            goodsInfo.property = body.goodsInfo.property;
            goodsInfo.unit = body.goodsInfo.unit;
            goodsInfo.unitPrice = body.goodsInfo.unitPrice;
            goodsInfo.isActive = body.goodsInfo.isActive;
            goodsInfo.info = body.goodsInfo.info;
            goodsInfo.tenantId = body.condition.tenantId;

            await print.save();
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },

    async getAdminGoodsInfo (ctx, next) {
        let keys = ['id', 'name', 'property', 'unit', 'unitPrice', 'isActive', 'info', 'tenantId'];
        const condition = keys.reduce((accu, curr) => {
            if (ctx.query[curr]) {
                accu[curr] = ctx.query[curr]
            }
            return accu;
        }, {})

        let pageNumber = parseInt(ctx.query.pageNumber);

        if(pageNumber<1){
            pageNumber=1
        }

        let pageSize = parseInt(ctx.query.pageSize);
        if(pageSize<1){
            pageSize=1
        }
        let place = (pageNumber - 1) * pageSize;
        if(condition.name!=null){
            condition.name = {
                $like : "%"+condition.name+"%"
            }
        }
        let goodsInfos = await GoodsInfos.findAll({
            where: condition,
            offset: Number(place),
            limit: Number(pageSize)
        });
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, goodsInfos);
    },

    async deleteAdminGoodsInfo(ctx, next){
        ctx.checkQuery('id').notEmpty();
        ctx.checkQuery('tenantId').notEmpty();
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }
        let id = ctx.query.id;
        let tenantId = ctx.query.tenantId;
        let keys = ['id', 'name', 'property', 'unit', 'unitPrice', 'isActive', 'info', 'tenantId'];
        const condition = keys.reduce((accu, curr) => {
            if (ctx.query[curr]) {
                accu[curr] = ctx.query[curr]
            }
            return accu;
        }, {})
        let goodsInfos = await GoodsInfos.findAll({
            where: condition
        });

        if (goodsInfos == null || goodsInfos.length == 0) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, '商品不存在！');
            return;
        }

        let tasks = [];
        for (let i = 0;i<goodsInfos;i++) {
            tasks.push(goodsInfos[i].destroy());
        }

        await Promise.all(tasks);

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS);
    },

    async getAdminGoodsInfoCount (ctx, next) {
        let keys = ['id', 'name', 'property', 'unit', 'unitPrice', 'isActive', 'info', 'tenantId'];
        const condition = keys.reduce((accu, curr) => {
            if (ctx.query[curr]) {
                accu[curr] = ctx.query[curr]
            }
            return accu;
        }, {})

        // let pageNumber = parseInt(ctx.query.pageNumber);
        //
        // if(pageNumber<1){
        //     pageNumber=1
        // }
        //
        // let pageSize = parseInt(ctx.query.pageSize);
        // if(pageSize<1){
        //     pageSize=1
        // }
        // let place = (pageNumber - 1) * pageSize;

        let goodsInfosCount = await GoodsInfos.count({
            where: condition
        });
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, goodsInfosCount);
    },

    async getAdminGoodsInfoByGoodsNumber(ctx, next){
        ctx.checkQuery('goodsNumber').notBlank()
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }
        let goodInfo = await GoodsInfos.findOne({
            where:{
                goodsNumber : ctx.query.goodsNumber
            }
        })
        if(goodInfo==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"找不到次商品的基础信息");
            return;
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,goodInfo);
    }

}