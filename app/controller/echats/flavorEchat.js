const db = require('../../db/statisticsMySql/index');
const dbc = require('../../db/MySql/index')
const  Foods = dbc.models.Foods;
const Orders = dbc.models.Orders;
const Foods = db.models.Foods;

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
            for (let k = 0; k < food.length;k++){
                let orderNum = await Orders.sum('num',{
                    where:{
                        tenantId:food,
                        createdAt:{
                            $gt:getTime[i].start,
                            $lt:getTime[i].end
                        }
                    }
                })
            }



        }

    }
    let instance = {
        getCount: getCount
    }
    return instance;
})();
module.exports = getFindCount;