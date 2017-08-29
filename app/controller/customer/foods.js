const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
const db = require('../../db/mysql/index');
const util = require('util');
const moment = require('moment');

const Foods = db.models.Foods;
const Menus = db.models.Menus;
const Foodsofmenus = db.models.FoodsOfTMenus;
const Ratings = db.models.Ratings;
const ProfitSharings = db.models.ProfitSharings;
const promotionManager = require('./promotions');

module.exports = {
    async getEshopUserMenus (ctx, next) {
        // let menuId =  ctx.query.id;
        // let tenantId =  ctx.query.tenantId;
        // let consigneeId = ctx.query.consigneeId;
        const {
            id: menuId,
            tenantId,
            consigneeId,
            qrcodeId:QRCodeTemplateId
        } = ctx.query

        ctx.checkQuery('tenantId').notEmpty();
        ctx.checkQuery('consigneeId').notEmpty();
        ctx.checkQuery('qrcodeId').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }

        let excludeFoodIdArray = [];

        let profitSharings = await ProfitSharings.findAll({
            where: {
                tenantId: tenantId,
                consigneeId: consigneeId
            }
        });
        console.log("profitSharings===========" + profitSharings.length);
        if (profitSharings.length > 0) {
            excludeFoodIdArray = JSON.parse(profitSharings[0].excludeFoodId);
            console.log("excludeFoodIdArray:" + excludeFoodIdArray);
        }

        let menus;
        if (menuId == null) {
            menus = await Menus.findAll({
                where: {
                    tenantId: tenantId
                },
                attributes: [
                    'id',
                    'name',
                    'type'
                ],
                order: ["sort"]
            });
        } else {
            let menus = await Menus.findAll({
                where: {
                    id: menuId,
                },
                attributes: [
                    'id',
                    'name',
                    'type'
                ],
                order: ["sort"]
            });
        }

        let resultArray = [];

        let foodsofmenus;
        let foodArray = [];
        for (let i = 0; i < menus.length; i++) {
            foodsofmenus = await Foodsofmenus.findAll({
                where: {
                    MenuId: menus[i].id,
                }
            });
            let food;
            for (let j = 0; j < foodsofmenus.length; j++) {
                if (excludeFoodIdArray != null && excludeFoodIdArray.length > 0 && excludeFoodIdArray.indexOf(foodsofmenus[j].FoodId) != -1) {
                    console.log("GGGGGGGGGGG||" + foodsofmenus[j].FoodId);
                    console.log("HHHHHHHHHHH||" + excludeFoodIdArray.indexOf(foodsofmenus[j].FoodId))
                    continue;
                }
                food = await Foods.findAll({
                    where: {
                        id: foodsofmenus[j].FoodId,
                        tenantId: tenantId,
                        isActive: true,
                    },
                    attributes: {
                        exclude: ['createdAt', 'updatedAt', 'deletedAt', 'isActive']
                    },
                    include: [{
                        model: Ratings,
                        where: {FoodId: foodsofmenus[j].FoodId},
                        required: false,
                        attributes: [
                            'username',
                            'rateTime',
                            'rateType',
                            'text',
                            'avatar'
                        ]
                    }]
                });

                if (food.length == 0) {
                    continue;
                }

                food = JSON.parse(JSON.stringify(food));

                food.forEach(e => {
                    //首杯半价（青豆家写死）
                    if (e.id == 21) {
                        e.coupon = "半价限购1份";
                    }
                    e.Ratings = e.Ratings.map(rating => {
                        rating.username = rating.username.slice(0, 3) + '****' + rating.username.slice(-4)
                        return rating
                    })
                })

                food[0].goodsPromotion = await promotionManager.getGoodsPromotion(QRCodeTemplateId, food[0].id, tenantId);

                foodArray.push(food[0]);
            }

            resultArray[i] = {};
            resultArray[i].id = menus[i].id;
            resultArray[i].name = menus[i].name;
            resultArray[i].type = menus[i].type;
            resultArray[i].foods = foodArray;
            foodArray = []
        }

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, resultArray)
    },

    async getUserMenus (ctx, next) {
        let menuId = ctx.query.id;
        let tenantId = ctx.query.tenantId;
        let QRCodeTemplateId = ctx.query.qrcodeId;

        ctx.checkQuery('tenantId').notEmpty();
        ctx.checkQuery('qrcodeId').notEmpty();
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }

        let menus;
        if (menuId == null) {
            menus = await Menus.findAll({
                where: {
                    tenantId: tenantId
                },
                attributes: [
                    'id',
                    'name',
                    'type'
                ],
                order: ["sort"]
            });
        } else {
            menus = await Menus.findAll({
                where: {
                    id: menuId,
                    tenantId: tenantId,
                },
                attributes: [
                    'id',
                    'name',
                    'type'
                ],
                order: ["sort"]
            });
        }

        let resultArray = [];

        let foodsofmenus;
        let foodArray = [];
        for (let i = 0; i < menus.length; i++) {
            foodsofmenus = await Foodsofmenus.findAll({
                where: {
                    MenuId: menus[i].id,
                    tenantId: tenantId
                }
            });
            let food;
            for (let j = 0; j < foodsofmenus.length; j++) {
                food = await Foods.findAll({
                    where: {
                        id: foodsofmenus[j].FoodId,
                        tenantId: tenantId,
                        isActive: true,
                    },
                    attributes: {
                        exclude: ['createdAt', 'updatedAt', 'deletedAt', 'isActive']
                    },
                    include: [{
                        model: Ratings,
                        where: {FoodId: foodsofmenus[j].FoodId},
                        required: false,
                        attributes: [
                            'username',
                            'rateTime',
                            'rateType',
                            'text',
                            'avatar'
                        ]
                    }]
                });

                if (food.length == 0) {
                    continue;
                }

                food.forEach(e => {
                    //首杯半价（青豆家写死）
                    if (e.id == 21) {
                        e.coupon = "半价限购1份";
                    }
                    
                    e.Ratings = e.Ratings.map(rating => {
                        rating.username = rating.username.slice(0, 3) + '****' + rating.username.slice(-4)
                        return rating
                    })
                })

                food[0].goodsPromotion = await promotionManager.getGoodsPromotion(QRCodeTemplateId, food[0].id, tenantId);
                foodArray.push(food[0]);
            }

            resultArray[i] = {};
            resultArray[i].id = menus[i].id;

            resultArray[i].name = menus[i].name;
            resultArray[i].type = menus[i].type;
            resultArray[i].foods = foodArray;
            foodArray = []
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, resultArray)
    },
    async saveUserRating (ctx, next) {
        ctx.checkBody('userName').notEmpty();
        ctx.checkBody('text').notEmpty();
        ctx.checkBody('avatar').notEmpty();
        ctx.checkBody('tenantId').notEmpty();
        ctx.checkBody('FoodId').notEmpty();

        let body = ctx.request.body;
        await Ratings.create({
            username: body.userName,
            rateTime: new Date(),
            text: body.text,
            avatar: body.avatar || 'http://static.galileo.xiaojukeji.com/static/tms/default_header.png',
            tenantId: body.tenantId,
            FoodId: body.FoodId,
        });
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    }
}