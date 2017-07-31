const db = require('../../db/statisticsMySql/index');
const dbc = require('../../db/MySql/index')
// const  Foods = dbc.models.Foods;
const Orders = dbc.models.Orders;
const FoodsOfTMenus = dbc.models.FoodsOfTMenus;
const Menus = db.models.Menus;

const getFindCount = (function () {

    let getCount = async function (tenantId,startTime,endTime,type,foodname) {
        let getTime;
        if(type==1){
            getTime = await getDayEchat.getDay(startTime,endTime)
        }
        for (let i = 0; i < getTime.length; i++){
            let food =[]
            let orderMenus = await Orders.findAll({
                where:{
                    tenantId:tenantId,
                    createdAt:{
                        $gt:getTime[i].start,
                        $lt:getTime[i].end
                    }
                }
            })
            for (let j = 0;j<orderMenus.length;j++){
                if(!food.contains(orderMenus[i].FoodId)){
                    food.push(orderMenus[i].FoodId)
                }
            }
            //根据foodId找到数量
            let result = [];
            for (let k = 0; k < food.length;k++){
                let foods = await Foods.findOne({
                    where:{
                        id:food[i]
                    }
                })
                //根据food[i]查找到数量
                let num = await Orders.sum('num',{
                    where:{
                        FoodId:food[i],
                        createdAt:{
                            $gt:getTime[i].start,
                            $lt:getTime[i].end
                        }
                    }
                })
                let foodsofmenus = await FoodsOfTMenus.findOne({
                    where:{
                        FoodId:food[i]
                    }
                })
                let menus = await Menus.findById(foodsofmenus.MenuId)
                result.push({
                    menusName:menus.name,
                    foodsName:foods.name,
                    num:num
                })
            }
            let menuNum = [];
            for(let j=0;j<result.length;j++){
                let num = 0;
                if(!menuNum.contains(result[j].menusName)){
                    menuNum.push({
                        name:result[j].menusName,
                        num : 0
                    })

                }
            }
            let num = 0;
            for(let k = 0;k<menuNum.length;k++){
                for(let g =0;g<result.length;g++){
                    if(menuNum[k].name.contains(result[g].menusName)){
                        menuNum[k].num+=result[g].num
                    }
                }
            }
            return menuNum;
        }

    }
    let instance = {
        getCount: getCount
    }
    return instance;
})();
module.exports = getFindCount;