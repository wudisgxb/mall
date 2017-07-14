const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
let Foods = db.models.Foods;
let Menus = db.models.Menus;
let Foodsofmenus = db.models.FoodsOfTMenus;


module.exports = {

    async saveAdminFoods (ctx, next) {
        ctx.checkBody('/food/name',true).first().notEmpty();
        ctx.checkBody('/food/image',true).first().notEmpty();
        ctx.checkBody('/food/icon',true).first().notEmpty();
        ctx.checkBody('/food/price',true).first().notEmpty().isFloat().ge(0).toFloat();
        ctx.checkBody('/food/oldPrice',true).first().notEmpty().isFloat().ge(0).toFloat();
        ctx.checkBody('/food/vipPrice',true).first().notEmpty().isFloat().ge(0).toFloat();
        ctx.checkBody('/food/sellCount',true).first().notEmpty().isInt().ge(0).toInt();
        ctx.checkBody('/food/rating',true).first().notEmpty().isInt().ge(0).toInt();
        ctx.checkBody('/food/info',true).first().notEmpty();
        ctx.checkBody('/food/unit',true).first().notEmpty();
        ctx.checkBody('/food/foodNum',true).first().notEmpty();
        ctx.checkBody('/food/menuId',true).first().notEmpty();
        ctx.checkBody('/food/isActive',true).first().notEmpty();
        ctx.checkBody('tenantId').notEmpty();
 //       ctx.checkBody('/food/id',true).first().notEmpty();
        // ctx.checkBody('/condition/id',true).first().notEmpty();

        let body = ctx.request.body;

        // if (!(body.menuIds instanceof Array)) {
        //     body.menuIds = [body.menuIds];
        // }

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors );
            return;
        }

        let food = await Foods.findAll({
            where: {
                tenantId:body.tenantId,
                name:body.food.name
            }
        });
        if(food.length>0){
            ctx.body = new ApiResult(ApiResult.Result.EXISTED,"食物已存在！" );
            return;
        }

        let foods;
        foods = await Foods.create({
                name: body.food.name,
                image: body.food.image,
                icon: body.food.icon,
                price: body.food.price,
                oldPrice: body.food.oldPrice,
                vipPrice: body.food.vipPrice,
                sellCount: body.food.sellCount,
                foodNum:body.food.foodNum,
                rating: body.food.rating,
                info: body.food.info,
                unit: body.food.unit,
                taste: JSON.stringify(body.food.taste),
                isActive: body.food.isActive,
                tenantId: body.tenantId

                // todo: ok?
                //deletedAt: Date.now()
            });

            await Foodsofmenus.create({
                FoodId: foods.id,
                MenuId: body.food.menuId,
                tenantId: body.tenantId
            });

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)

    },

    async updateAdminFoodsById (ctx, next) {
        ctx.checkBody('/food/name',true).first().notEmpty();
        ctx.checkBody('/food/image',true).first().notEmpty();
        ctx.checkBody('/food/icon',true).first().notEmpty();
        ctx.checkBody('/food/price',true).first().notEmpty().isFloat().ge(0).toFloat();
        ctx.checkBody('/food/oldPrice',true).first().notEmpty().isFloat().ge(0).toFloat();
        ctx.checkBody('/food/vipPrice',true).first().notEmpty().isFloat().ge(0).toFloat();
        ctx.checkBody('/food/sellCount',true).first().notEmpty().isInt().ge(0).toInt();
        ctx.checkBody('/food/rating',true).first().notEmpty().isInt().ge(0).toInt();
        ctx.checkBody('/food/info',true).first().notEmpty();
        ctx.checkBody('/food/isActive',true).first().notEmpty();
        ctx.checkBody('/food/foodNum',true).first().notEmpty();
        ctx.checkBody('/food/menuId',true).first().notEmpty();
        ctx.checkBody('/condition/tenantId',true).first().notEmpty();
        ctx.checkBody('/condition/id',true).first().notEmpty();

        let body = ctx.request.body;
        // if (!(body.menuIds instanceof Array)) {
        //     body.menuIds = [body.menuIds];
        // }
        //body.menuIds = body.menuIds;
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors );
            return;
        }
        let createMenuTask = [];
        let foods;/food/
        foods = await Foods.findById(
            body.condition.id
        );
        if (foods != null) {
            foods.id = body.condition.id;
            foods.name = body.food.name;
            foods.image = body.food.image;
            foods.foodNum=body.food.foodNum;
            foods.icon = body.food.icon;
            foods.price = body.food.price;
            foods.oldPrice = body.food.oldPrice;
            foods.vipPrice = body.food.vipPrice;
            foods.sellCount = body.food.sellCount;
            foods.rating = body.food.rating;
            foods.info = body.food.info;
            foods.state=JSON.stringify(body.food.state);
            foods.unit = body.food.unit;
            foods.isActive = body.food.isActive;
            foods.tenantId = body.condition.tenantId;

            await foods.save();
            let foodsofmenus;
            foodsofmenus =  await Foodsofmenus.findOne({
                where: {
                    FoodId: foods.id,
                    tenantId:body.tenantId
                },

            });
            foodsofmenus.FoodId=foods.id;
            foodsofmenus.MenuId = body.food.menuId;
            foodsofmenus.tenantId = body.tenantId;
            await foodsofmenus.save();
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },
//获取租户下所有商品

    async getAdminFoods (ctx, next) {
        ctx.checkQuery('tenantId').notEmpty();
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors );
            return;
        }
        //查询foods
        let foods = await Foods.findAll({
            where: {
                tenantId: ctx.query.tenantId//iftenantId="68d473e77f459833bb06c60f9a8f4809"
            }
        });
        let foodId;
        let menuName;
        let menuId;
        let foodsJson = [];
        let i;

        for (i = 0; i < foods.length; i++) {
            foodId = foods[i].id;//foodId=1,2,3,4,5,6,7,8,9
            menuId = await Foodsofmenus.findAll({
                where: {
                    FoodId: foodId//menuId=1,2,3,4,1,2,3,4,1
                },
                attributes: [
                    'MenuId'
                ]
            });
            if (menuId.length == 0) {
                continue;
            }
            menuName = await Menus.findAll({
                where: {
                    id: menuId[0].MenuId//menuName="冷菜1,热销榜2,热销榜3,热销榜4"
                },
                attributes: [
                    'name'
                ]
            });
            foodsJson[i] = {};

            foodsJson[i].id = foods[i].id;
            foodsJson[i].name = foods[i].name;
            foodsJson[i].foodNum = foods[i].foodNum;
            foodsJson[i].image = foods[i].image;
            foodsJson[i].icon = foods[i].icon;
            foodsJson[i].price = foods[i].price;
            foodsJson[i].oldPrice = foods[i].oldPrice;
            foodsJson[i].vipPrice = foods[i].vipPrice;
            foodsJson[i].isActive = foods[i].isActive;
            foodsJson[i].taste=JSON.parse(foods[i].taste);
            foodsJson[i].rest=(foods[0].foodNum-foods[0].todaySales)<=0?0:(foods[0].foodNum-foods[0].todaySales);
            // foodsJson[i].name = foods[i].name;
            foodsJson[i].info=foods[i].info;
            foodsJson[i].menuName = menuName[0].name;
            foodsJson[i].unit = foods[i].unit;
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, foodsJson);

    },

    // async deleteFoods(ctx, next){
    //     let foods = await Foods.findAll();
    //
    // },

}