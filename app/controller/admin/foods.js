const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
const Sequelize = require('sequelize')
let db = require('../../db/mysql/index');
let getFoodNum = require('../../controller/statistics/statistics');
let OrderGoods = db.models.OrderGoods
let Foods = db.models.Foods;
let Menus = db.models.Menus;
let Units = db.models.Units;
let Foodsofmenus = db.models.FoodsOfTMenus;
let FoodsOfUnits = db.models.FoodsOfUnits;
const Tool = require('../../Tool/tool');


module.exports = {
    async updateAdminFoodsBySellCount(ctx, next){
        let foods = await Foods.findAll({})
        // console.log(foods.length)
        let foodSellcount = [];
        for (let i = 0; i < foods.length; i++) {
            foodSellcount.push(Foods.update({
                sellCount: "0"
            }, {
                where: {
                    id: foods[i].id
                }
            }))
        }
        await foodSellcount
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },
    async saveAdminFoods (ctx, next) {
        ctx.checkBody('/food/name', true).first().notEmpty();
        ctx.checkBody('/food/image', true).first().notEmpty();
        // ctx.checkBody('/food/minuteImage',true).first().notEmpty();//详细图片
        // ctx.checkBody('/food/icon', true).first().notEmpty();
        ctx.checkBody('/food/price', true).first().notEmpty().isFloat().ge(0).toFloat();
        ctx.checkBody('/food/constPrice', true).first().notEmpty().isFloat().ge(0).toFloat();
        ctx.checkBody('/food/oldPrice', true).first().notEmpty().isFloat().ge(0).toFloat();
        ctx.checkBody('/food/vipPrice', true).first().notEmpty().isFloat().ge(0).toFloat();
        // ctx.checkBody('/food/info', true).first().notEmpty();
        ctx.checkBody('/food/unitId', true).first().notBlank();
        ctx.checkBody('/food/foodNum', true).first().notEmpty();
        ctx.checkBody('/food/menuId', true).first().notEmpty();
        ctx.checkBody('/food/isActive', true).first().notEmpty();
        // ctx.checkBody('/food/integral', true).first().notEmpty();
        ctx.checkBody('tenantId').notEmpty();

        // ctx.checkBody('/food/id',true).first().notEmpty();
        // ctx.checkBody('/condition/id',true).first().notEmpty();

        let body = ctx.request.body;

        // if (!(body.menuIds instanceof Array)) {
        //     body.menuIds = [body.menuIds];
        // }

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }

        let food = await Foods.findAll({
            where: {
                tenantId: body.tenantId,
                name: body.food.name
            }
        });
        // logger.info(food.length)
        if (food.length > 0) {
            ctx.body = new ApiResult(ApiResult.Result.EXISTED, "食物已存在！");
            return;
        }
        let menu = await Menus.findOne({
            where:{
                id : body.food.menuId
            }
        })
        if(menu==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"请选择菜品类别")
            return
        }
        // console.log(Units)
        let unit = await Units.findOne({
            where:{
                id : body.food.unitId
            }
        })
        // console.log(unit)
        if(unit==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"没有此单位")
            return
        }

        let image

        if (Tool.isArray(body.food.image)) {
            image = JSON.stringify(body.food.image)
        } else {
            image = body.food.image
        }
        let minuteImage =[]
        if(body.food.minuteImage!=null){
            if(Tool.isArray(body.food.minuteImage)){
                minuteImage = body.food.minuteImage
            }else{
                minuteImage.push(body.food.minuteImage)
            }
        }

        let info
        if(body.food.info==null){
            info = ""
        }else{
            info=body.food.info
        }

        let foods;
        // console.log(444444444444444)
        foods = await Foods.create({
            name: body.food.name,
            image: image,
            minuteImage : JSON.stringify(minuteImage),
            icon: (body.food.icon == null) ? "" : body.food.icon,
            price: body.food.price,
            constPrice : body.food.constPrice,
            oldPrice: body.food.oldPrice,
            vipPrice: body.food.vipPrice,
            sellCount: 100,
            foodNum: body.food.foodNum,
            rating: body.food.rating,
            info: info,
            unit: unit==null?"":unit.goodUnit,
            cardId:body.food.cardId,
            taste: JSON.stringify(body.food.taste),
            isActive: body.food.isActive,
            tenantId: body.tenantId,
            integral : body.food.integral==null?0:body.food.integral

            // todo: ok?
            //deletedAt: Date.now()
        });
        // console.log()
        // if(unit==null){
        //     await Units.create({
        //         goodUnit : unit.goodUnit
        //     })
        // }
        await Foodsofmenus.create({
            FoodId: foods.id,
            MenuId: body.food.menuId,
            tenantId: body.tenantId
        });
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)

    },

    async updateAdminFoodsById (ctx, next) {
        // ctx.checkBody('/food/name', true).first().notEmpty();
        // ctx.checkBody('/food/image', true).first().notEmpty();
        // ctx.checkBody('/food/minuteImage', true).first().notEmpty();
        // ctx.checkBody('/food/icon', true).first().notEmpty();
        // ctx.checkBody('/food/price', true).first().notEmpty().isFloat().ge(0).toFloat();
        // ctx.checkBody('/food/constPrice', true).first().notEmpty().isFloat().ge(0).toFloat();
        // ctx.checkBody('/food/oldPrice', true).first().notEmpty().isFloat().ge(0).toFloat();
        // ctx.checkBody('/food/vipPrice', true).first().notEmpty().isFloat().ge(0).toFloat();
        // ctx.checkBody('/food/sellCount', true).first().notEmpty().isInt().ge(0).toInt();
        // ctx.checkBody('/food/rating', true).first().notEmpty().isInt().ge(0).toInt();
        // ctx.checkBody('/food/info', true).first().notEmpty();
        // ctx.checkBody('/food/unit', true).first().notEmpty();
        // ctx.checkBody('/food/isActive', true).first().notEmpty();
        // ctx.checkBody('/food/foodNum', true).first().notEmpty();
        // ctx.checkBody('/food/menuId', true).first().notEmpty();
        ctx.checkBody('/condition/tenantId', true).first().notEmpty();
        ctx.checkBody('/condition/id', true).first().notEmpty();

        let body = ctx.request.body;
        let keys = ['name', 'image', 'minuteImage', 'icon', 'price', 'constPrice', 'oldPrice',
            'vipPrice', 'sellCount', 'rating', 'info', 'unit', 'isActive', 'foodNum'];
        const condition = await keys.reduce((accu, curr,curi,array) => {
            // console.log(body.food[curr]!=null)
            if (body.food[curr]!=null) {
                accu[curr] = body.food[curr]
            }
            return accu;
        }, {})
        // if (!(body.menuIds instanceof Array)) {
        //     body.menuIds = [body.menuIds];
        // }
        //body.menuIds = body.menuIds;
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }
        //let createMenuTask = [];
        // let foods;
        // // foods = await Foods.findOne({
        // //     where: {
        // //         id: body.condition.id,
        // //         tenantId: body.condition.tenantId
        // //     }
        // // });
        // // if(foods==null){
        // //     ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"没有此商品记录")
        // //     return
        // // }
        // // console.log(foods)
        // // let image;
        // // if (body.food.image instanceof Array) {
        // //     image = JSON.stringify(body.food.image)
        // // } else {
        // //     image = body.food.image
        // // }
        // //
        // // let minuteImage = [];
        // // if (body.food.minuteImage instanceof Array) {
        // //     minuteImage = body.food.minuteImage
        // // } else {
        // //     minuteImage.push(body.food.minuteImage)
        // // }
        // // console.log(1111)
        // // let unit = await Units.findOne({
        // //     where:{
        // //         goodUnit :body.food.unit,
        // //         tenantId : body.condition.tenantId
        // //     }
        // // })
        // // console.log(3333333)
        // // if(unit==null){
        // //     await Units.create({
        // //         goodUnit : body.food.unit,
        // //         tenantId : body.condition.tenantId
        // //     })
        // // }
        // // let info
        // // if(body.food.info==null){
        // //     info = ""
        // // }else{
        // //     info = body.food.info
        // // }
        //
        //
        //
        //     foods.id = body.condition.id;
        //     foods.name = body.food.name;
        //     foods.image = image;
        //     foods.minuteImage = JSON.stringify(minuteImage);
        //     foods.foodNum = body.food.foodNum;
        //     foods.icon = (body.food.icon) == null ? "" : body.food.icon;
        //     foods.price = body.food.price;
        //     foods.constPrice = body.food.constPrice;
        //     foods.oldPrice = body.food.oldPrice;
        //     foods.vipPrice = body.food.vipPrice;
        //     foods.sellCount = body.food.sellCount;
        //     foods.rating = body.food.rating;
        //     foods.info = info;
        //     foods.taste = JSON.stringify(body.food.taste == null ? "" : body.food.taste);
        //     foods.unit = body.food.unit;
        //     foods.cardId = body.food.cardId;
        //     foods.integral = body.food.integral==null?0:body.food.integral;
        //     // foods.isActive = body.food.isActive;
        //     foods.tenantId = body.condition.tenantId;
        //
        //     await foods.save();
        //     let foodsofmenus = await Foodsofmenus.findOne({
        //         where: {
        //             FoodId: foods.id,
        //             tenantId: body.tenantId
        //         },
        //     });
        //     if (foodsofmenus != null) {
        //         foodsofmenus.FoodId = body.condition.id;
        //         foodsofmenus.MenuId = body.foods.menuId;
        //         foodsofmenus.tenantId = body.tenantId;
        //         await foodsofmenus.save();
        //     }
        console.log(condition)
        await Foods.update(
            condition
        ,{where:{
                tenantId : body.condition.tenantId,
                id : body.condition.id
        }})
        if(body.food.MenuId!=null&&body.food.MenuId!=""){
            await Foodsofmenus.update({
                MenuId : body.food.MenuId,
                // FoodId : body.condition.id,
                // tenantId : body.condition.tenantId
            },{where:{
                FoodId : body.condition.id,
                tenantId : body.condition.tenantId
            }})
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },

    // async updateFoodOne(ctx,next){
    //     let food = await Foods.findAll({
    //         where:{
    //             id :1076
    //         }
    //     })
    //     let foodArray = []
    //     for(let f of food){
    //         let minuteImageArray = []
    //         try{
    //             let minuteImage = f.minuteImage
    //             if(Tool.isArray(JSON.parse(minuteImage))){
    //                 // minuteImageArray.push(JSON.stringify(f.minuteImage))
    //                 // console.log("11111111111111111111111111111111"+minuteImage)
    //             }else{
    //                 // minuteImageArray.push(f.minuteImage)
    //                 // console.log("222222222222222222222222222222222"+minuteImage)
    //             }
    //         }catch (e){
    //             console.log(e)
    //         }
    //
    //         // let foodImageArray = []
    //         // let image = f.image
    //         // console.log()
    //         // try{
    //         //     if(Tool.isArray(JSON.parse(image))){
    //         //         foodImageArray = JSON.parse(image)
    //         //     }
    //         // }catch (e){
    //         //     foodImageArray.push(image)
    //         // }
    //         //
    //         // foodArray.push(Foods.update({
    //         //     minuteImage : JSON.stringify(foodImageArray)
    //         // },{
    //         //     where:{
    //         //         id : f.id
    //         //     }
    //         // }))
    //     }
    //
    //     ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    // },

    //获取租户下所有商品
    async getAdminFoods (ctx, next) {

        ctx.checkQuery('tenantId').notEmpty();
        // let foodnum = ctx.query.num;
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }
        let pageNumber = parseInt(ctx.query.pageNumber);

        if(pageNumber<1){
            pageNumber=1
        }

        let pageSize = parseInt(ctx.query.pageSize);
        if(pageNumber<1){
            pageNumber=1
        }
        let place = (pageNumber - 1) * pageSize;
        //查询foods
        let foods = []
        let foodsArray = [];
        //判断是否传了菜的Id
        if(ctx.query.menuId!=null&&ctx.query.menuId!=""){

            //判断是否传了分页参数
            if(ctx.query.pageNumber!=null&&ctx.query.pageNumber!=""&&ctx.query.pageSize!=null&&ctx.query.pageSize!=""){
                if(ctx.query.name!=null&&ctx.query.name!=""){
                    console.log("传了3个正确的参数")
                    let menu = await Menus.findOne({
                        where:{
                            tenantId : ctx.query.tenantId,
                            Id : ctx.query.menuId
                        }
                    })
                    // console.log(menu.name)

                    let foodMenu = await Foodsofmenus.findAll({
                        where:{
                            tenantId : ctx.query.tenantId,
                            menuId : ctx.query.menuId
                        }
                    })
                    let foodId = []
                    for(let foodM of foodMenu){
                        if(!foodId.contains(foodM.FoodId)){
                            foodId.push(foodM.FoodId)
                        }
                    }

                    let food = await Foods.findAll({
                        where:{
                            id :{
                                $in :foodId
                            },
                            name :{
                                $like : "%"+ctx.query.name+"%"
                            },
                            isActive : true
                        },

                        offset: Number(place),
                        limit: Number(pageSize)
                    })
                    for(let f of food){
                        let images = f.image
                        //图片
                        let img
                        try {
                            if (Tool.isArray(JSON.parse(images))) {
                                img = []
                                img = JSON.parse(images)
                            }
                        } catch (e) {
                            img = images
                        }
                        //详细图片
                        let minuteImage
                        try{
                            if(f.minuteImage!=null){
                                minuteImage =JSON.parse(f.minuteImage)
                            }else{
                                minuteImage = null
                            }
                        }catch (e){
                            minuteImage=""
                        }
                        // console.log(33333333333333333)
                        let foodsJson = {}
                        // foodsJson.id = f.id;
                        foodsJson.name = f.name;
                        foodsJson.foodNum = f.foodNum;
                        foodsJson.image = img;
                        foodsJson.minuteImage = minuteImage;
                        // foodsJson.icon = foods[i].icon;
                        foodsJson.price = f.price;
                        foodsJson.constPrice = f.constPrice==0?"":f.constPrice;
                        foodsJson.oldPrice = f.oldPrice;
                        foodsJson.vipPrice = f.vipPrice;
                        foodsJson.isActive = f.isActive;
                        foodsJson.taste = JSON.parse(f.taste);
                        foodsJson.sellCount = f.sellCount;
                        foodsJson.rating = f.rating;
                        foodsJson.rest = (f.foodNum - f.todaySales) <= 0 ? 0 : (f.foodNum - f.todaySales);
                        // foodsJson[i].name = foods[i].name;
                        foodsJson.info = f.info;
                        foodsJson.menuName = menu.name;
                        foodsJson.unit = f.unit;
                        foodsJson.cardId = f.cardId;
                        foodsJson.integral = f.integral;
                        foodsArray.push(foodsJson)
                    }
                }else{
                    console.log("传了3个参数")
                    let menu = await Menus.findOne({
                        where:{
                            tenantId : ctx.query.tenantId,
                            Id : ctx.query.menuId
                        }
                    })
                    // console.log(menu.name)

                    let foodMenu = await Foodsofmenus.findAll({
                        where:{
                            tenantId : ctx.query.tenantId,
                            menuId : ctx.query.menuId
                        }
                    })
                    let foodId = []
                    for(let foodM of foodMenu){
                        if(!foodId.contains(foodM.FoodId)){
                            foodId.push(foodM.FoodId)
                        }
                    }

                    let food = await Foods.findAll({
                        where:{
                            id :{
                                $in :foodId
                            },
                            isActive : 1
                        },
                        offset: Number(place),
                        limit: Number(pageSize)
                    })
                    for(let f of food){
                        let images = f.image
                        //图片
                        let img
                        try {
                            if (Tool.isArray(JSON.parse(images))) {
                                img = []
                                img = JSON.parse(images)
                            }
                        } catch (e) {
                            img = images
                        }
                        //详细图片
                        let minuteImage
                        try{
                            if(f.minuteImage!=null){
                                minuteImage =JSON.parse(f.minuteImage)
                            }else{
                                minuteImage = null
                            }
                        }catch (e){
                            minuteImage=""
                        }
                        // console.log(33333333333333333)
                        let foodsJson = {}
                        // foodsJson.id = f.id;
                        foodsJson.name = f.name;
                        foodsJson.foodNum = f.foodNum;
                        foodsJson.image = img;
                        foodsJson.minuteImage = minuteImage;
                        // foodsJson.icon = foods[i].icon;
                        foodsJson.price = f.price;
                        foodsJson.constPrice = f.constPrice==0?"":f.constPrice;
                        foodsJson.oldPrice = f.oldPrice;
                        foodsJson.vipPrice = f.vipPrice;
                        foodsJson.isActive = f.isActive;
                        foodsJson.taste = JSON.parse(f.taste);
                        foodsJson.sellCount = f.sellCount;
                        foodsJson.rating = f.rating;
                        foodsJson.rest = (f.foodNum - f.todaySales) <= 0 ? 0 : (f.foodNum - f.todaySales);
                        // foodsJson[i].name = foods[i].name;
                        foodsJson.info = f.info;
                        foodsJson.menuName = menu.name;
                        foodsJson.unit = f.unit;
                        foodsJson.cardId = f.cardId;
                        foodsJson.integral = f.integral;
                        foodsArray.push(foodsJson)
                    }
                }



            }else{
               console.log(4444444)
                //判断是否传了name进行模糊查询
                if(ctx.query.name!=null&&ctx.query.name!=""){
                    //传了菜的Id,分页参数，name模糊查询(完成)
                    let menu = await Menus.findOne({
                        where:{
                            tenantId : ctx.query.tenantId,
                            Id : ctx.query.menuId
                        }
                    })

                    let foodMenu = await Foodsofmenus.findAll({
                        where:{
                            tenantId : ctx.query.tenantId,
                            menuId : ctx.query.menuId
                        }
                    })
                    // console.log(111111111111)
                    // console.log(foodMenu)
                    let foodId = []
                    for(let foodM of foodMenu){
                        if(!foodId.contains(foodM.FoodId)){
                            foodId.push(foodM.FoodId)
                        }
                    }
                    console.log(ctx.query.name)
                    let food = await Foods.findAll({
                        where:{
                            id :{
                                $in :foodId
                            },
                            name :{
                                $like : "%"+ctx.query.name+"%"
                            },
                            isActive:1
                        }
                    })
                    console.log(food)
                    for(let f of food){
                        let images = f.image
                        //图片
                        let img
                        try {
                            if (Tool.isArray(JSON.parse(images))) {
                                img = []
                                img = JSON.parse(images)
                            }
                        } catch (e) {
                            img = images
                        }
                        //详细图片
                        let minuteImage
                        try{
                            if(f.minuteImage!=null){
                                minuteImage =JSON.parse(f.minuteImage)
                            }else{
                                minuteImage = null
                            }
                        }catch (e){
                            minuteImage=""
                        }
                        // console.log(33333333333333333)
                        let foodsJson = {}
                        // foodsJson.id = f.id;
                        foodsJson.name = f.name;
                        foodsJson.foodNum = f.foodNum;
                        foodsJson.image = img;
                        foodsJson.minuteImage = minuteImage;
                        // foodsJson.icon = foods[i].icon;
                        foodsJson.price = f.price;
                        foodsJson.constPrice = f.constPrice==0?"":f.constPrice;
                        foodsJson.oldPrice = f.oldPrice;
                        foodsJson.vipPrice = f.vipPrice;
                        foodsJson.isActive = f.isActive;
                        foodsJson.taste = JSON.parse(f.taste);
                        foodsJson.sellCount = f.sellCount;
                        foodsJson.rating = f.rating;
                        foodsJson.rest = (f.foodNum - f.todaySales) <= 0 ? 0 : (f.foodNum - f.todaySales);
                        // foodsJson[i].name = foods[i].name;
                        foodsJson.info = f.info;
                        foodsJson.menuName = menu.name;
                        foodsJson.unit = f.unit;
                        foodsJson.cardId = f.cardId;
                        foodsJson.integral = f.integral;
                        foodsArray.push(foodsJson)
                    }
                }else{
                    //传了菜品的Id，分页，没有name模糊查询(完成)
                    let menu = await Menus.findOne({
                        where:{
                            tenantId : ctx.query.tenantId,
                            Id : ctx.query.menuId
                        }
                    })

                    let foodMenu = await Foodsofmenus.findAll({
                        where:{
                            tenantId : ctx.query.tenantId,
                            menuId : ctx.query.menuId
                        }
                    })

                    let foodId = []
                    for(let foodM of foodMenu){
                        if(!foodId.contains(foodM.FoodId)){
                            foodId.push(foodM.FoodId)
                        }
                    }

                    let food = await Foods.findAll({
                        where:{
                            id :{
                                $in :foodId
                            }
                        }
                    })
                    for(let f of food){
                        let images = f.image
                        //图片
                        let img
                        try {
                            if (Tool.isArray(JSON.parse(images))) {
                                img = []
                                img = JSON.parse(images)
                            }
                        } catch (e) {
                            img = images
                        }
                        //详细图片
                        let minuteImage
                        try{
                            if(f.minuteImage!=null){
                                minuteImage =JSON.parse(f.minuteImage)
                            }else{
                                minuteImage = null
                            }
                        }catch (e){
                            minuteImage=""
                        }
                        // console.log(33333333333333333)
                        let foodsJson = {}
                        // foodsJson.id = f.id;
                        foodsJson.name = f.name;
                        foodsJson.foodNum = f.foodNum;
                        foodsJson.image = img;
                        foodsJson.minuteImage = minuteImage;
                        // foodsJson.icon = foods[i].icon;
                        foodsJson.price = f.price;
                        foodsJson.constPrice = f.constPrice==0?"":f.constPrice;
                        foodsJson.oldPrice = f.oldPrice;
                        foodsJson.vipPrice = f.vipPrice;
                        foodsJson.isActive = f.isActive;
                        foodsJson.taste = JSON.parse(f.taste);
                        foodsJson.sellCount = f.sellCount;
                        foodsJson.rating = f.rating;
                        foodsJson.rest = (f.foodNum - f.todaySales) <= 0 ? 0 : (f.foodNum - f.todaySales);
                        // foodsJson[i].name = foods[i].name;
                        foodsJson.info = f.info;
                        foodsJson.menuName = menu.name;
                        foodsJson.unit = f.unit;
                        foodsJson.cardId = f.cardId;
                        foodsJson.integral = f.integral;
                        foodsArray.push(foodsJson)
                    }

                }
            }
        }else{//没有菜品的Id
            //传了分页
            if(ctx.query.pageNumber!=null&&ctx.query.pageNumber!=""&&ctx.query.pageSize!=null&&ctx.query.pageSize!=""){
                //传了name
                if(ctx.query.name!=null&&ctx.query.name!=""){

                    let name = ctx.query.name
                    foods = await Foods.findAll({
                        where: {
                            tenantId: ctx.query.tenantId,//iftenantId="68d473e77f459833bb06c60f9a8f4809"
                            name : {
                                $like : "%"+name+"%"
                            },
                            isActive : true
                        },
                        offset: Number(place),
                        limit: Number(pageSize)
                    });
                    console.log(foods)

                }else{//没有没有name模糊查询(完成)

                    foods = await Foods.findAll({
                        where: {
                            tenantId: ctx.query.tenantId,//iftenantId="68d473e77f459833bb06c60f9a8f4809"
                            isActive : true
                        },
                        offset: Number(place),
                        limit: Number(pageSize)
                    });
                }

            }
            //没有分页
            if(ctx.query.pageNumber==null||ctx.query.pageNumber==""){
                //名字模糊查询(完成)
                if(ctx.query.name!=null&&ctx.query.name!=""){
                    let name = ctx.query.name
                    console.log(name)
                    foods = await Foods.findAll({
                        where: {
                            tenantId: ctx.query.tenantId,//iftenantId="68d473e77f459833bb06c60f9a8f4809"
                            name :{
                                $like : "%"+name+"%"
                            }
                        }
                    });
                }else{
                    //没有name，模糊查询，没有分页，没有商品Id
                    foods = await Foods.findAll({
                        where: {
                            tenantId: ctx.query.tenantId//iftenantId="68d473e77f459833bb06c60f9a8f4809"
                        },
                        isActive : true
                    });
                }
            }

            let foodId;
            let menuName;
            let menuId;

            for (let i = 0; i < foods.length; i++) {
                let images = foods[i].image

                let img
                try {
                    if (Tool.isArray(JSON.parse(images))) {
                        img = []
                        img = JSON.parse(images)
                    }
                } catch (e) {
                    img = images
                }

                foodId = foods[i].id;//foodId=222
                menuId = await Foodsofmenus.findAll({
                    where: {
                        FoodId: foodId//menuId=null
                    },
                    attributes: [
                        'MenuId'
                    ]
                });
                if (menuId.length == 0) {
                    continue;
                }//null
                menuName = await Menus.findAll({
                    where: {
                        id: menuId[0].MenuId//menuName="冷菜1,热销榜2,热销榜3,热销榜4"
                    },
                    attributes: [
                        'name'
                    ]
                });
                let unit = await Units.findOne({
                    where:{
                        goodUnit : foods[i].unit,
                        tenantId : ctx.query.tenantId
                    }
                })
                if(unit==null){
                    await Units.create({
                        goodUnit : foods[i].unit,
                        tenantId : ctx.query.tenantId
                    })
                }

                let minuteImage
                try{

                    if(foods[i].minuteImage!=null){
                        minuteImage =JSON.parse(foods[i].minuteImage)
                    }else{
                        minuteImage = null
                    }
                }catch (e){
                    minuteImage=""
                }
                let foodsJson = {};
                foodsJson.id = foods[i].id;
                foodsJson.name = foods[i].name;
                foodsJson.foodNum = foods[i].foodNum;
                foodsJson.image = img;
                foodsJson.minuteImage = minuteImage;
                // foodsJson.icon = foods[i].icon;
                foodsJson.price = foods[i].price;
                foodsJson.constPrice = foods[i].constPrice==0?"":foods[i].constPrice;
                foodsJson.oldPrice = foods[i].oldPrice;
                foodsJson.vipPrice = foods[i].vipPrice;
                foodsJson.isActive = foods[i].isActive;
                foodsJson.taste = JSON.parse(foods[i].taste);
                foodsJson.sellCount = foods[i].sellCount;
                foodsJson.rating = foods[i].rating;
                foodsJson.rest = (foods[i].foodNum - foods[i].todaySales) <= 0 ? 0 : (foods[i].foodNum - foods[i].todaySales);
                // foodsJson[i].name = foods[i].name;
                foodsJson.info = foods[i].info;
                foodsJson.menuName = menuName[0].name;
                foodsJson.unit = foods[i].unit;
                foodsJson.cardId = foods[i].cardId;
                foodsJson.integral = foods[i].integral;
                foodsArray.push(foodsJson)
            }

        }

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, foodsArray);
    },
    //
    async getAdminFoodsByCount(ctx, next){
        ctx.checkQuery('tenantId').notBlank()
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }
        let foodsCount
        if(ctx.query.name!=null&&ctx.query.name!=""){
            //判断是否有menuId字段
            if(ctx.query.menuId!=null){
                let foodsOfMenus = await Foodsofmenus.findAll({
                    where:{
                        tenantId : ctx.query.tenantId,
                        MenuId:ctx.query.menuId
                    }
                })
                let FoodId = [];
                for(let food of foodsOfMenus){
                    if(!FoodId.contains(food.FoodId)){
                        FoodId.push(food.FoodId)
                    }
                }
                let name = ctx.query.name
                let likeName = "%"+name+"%"

                foodsCount = await Foods.count({
                    where:{
                        id : {
                            $in : FoodId
                        },
                        name :{
                            $like : likeName
                        }
                    }
                })
            }else{
                let name = ctx.query.name
                let likeName = "%"+name+"%"

                foodsCount = await Foods.count({
                    where:{
                        tenantId : ctx.query.tenantId,
                        name :{
                            $like : likeName
                        }
                    }
                })
            }

        }else{
            if(ctx.query.menuId!=null){
                let foodMenus = await Foodsofmenus.findAll({
                    where:{
                        tenantId : ctx.query.tenantId,
                        menuId : ctx.query.menuId
                    }
                })
                let foodId = []
                for(let f of foodMenus){
                    if(!foodId.contains(f.FoodId)){
                        foodId.push(f.FoodId)
                    }
                }
                foodsCount = await Foods.count({
                    where:{
                        id : {
                            $in : foodId
                        },
                        tenantId : ctx.query.tenantId
                    }
                })
            }else{
                foodsCount = await Foods.count({
                    where:{
                        tenantId : ctx.query.tenantId
                    }
                })
            }

        }

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,foodsCount)
    },
    async deleteFoods(ctx,next){
        ctx.checkQuery('id').notEmpty();
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }
        let food = await Foods.findOne({
            where:{
                id : ctx.query.id
            }
        })
        console.log(food)
        console.time("111111111")
        let foodOfMenu = await Foodsofmenus.findAll({
            where:{
                FoodId : ctx.query.id
            }
        })
        let orderGoods = await OrderGoods.findAll({
            where:{
                FoodId : ctx.query.id
            }
        })
        console.timeEnd("111111111")
        if(food!=null&&foodOfMenu.length==0&&orderGoods.length==0){
            await foodOfMenu.forEach(function(e) {
                e.destroy()
            })
            await foodOfMenu.destroy()
            return
        }
        if(food==null&&foodOfMenu.length==0&&orderGoods.length==0){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"此商品已经删除，请不要重新删除")
            return
        }
        if(food==null&&foodOfMenu.length>0&&orderGoods.length==0){
            await foodOfMenu.forEach(function(e) {
                e.destroy()
            })
            return
        }
        if(food!=null&&foodOfMenu.length==0&&orderGoods.length==0){
            await foodOfMenu.destroy()
            return
        }

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    }

    // async deleteFoods(ctx, next){
    //     let foods = await Foods.findAll();
    //
    // },
}
