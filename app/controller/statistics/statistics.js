const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/statisticsMySql/index');
let Orders = db.models.Orders;


const getFoodNum = (function () {

    let getFood = async function (tenantId, foodnums) {

        let ArrayFood = [];
        let b;
        let lastDate = new Date()
        if(lastDate.getMonth()==1){
            lastDate.setYear(-1)
            b = lastDate.format("yyyy-12-dd 23:59:59")
        }else{
            lastDate.setDate(0);
            b = lastDate.format("yyyy-MM-dd 23:59:59");
        }

        let a;
        let firstDate = new Date();
        if(firstDate.getMonth()==1){
            firstDate.setYear(-1)
            a = firstDate.format("yyyy-11-dd 23:59:59")
        }else if(firstDate.getMonth()==2){
            firstDate.setDate(0);
            firstDate.setDate(1);
            a = firstDate.format("yyyy-MM-dd 00:00:00");
        }
        else{
            firstDate.setDate(0);
            firstDate.setDate(0)
            a = firstDate.format("yyyy-MM-dd 23:59:59");
        }

        console.log(b);
        console.log(a);
        let order;
        let orderNum;

        //根据tenantId和时间查询一个月前到今天的所有订单记录
        order = await Orders.findAll({
            where: {
                tenantId: tenantId,
                createdAt: {
                    $lt: new Date(b),
                    $gte: new Date(a)
                }
            },
            paranoid: false
        })

        for (let i = 0; i < order.length; i++) {
            if (!ArrayFood.contains(order[i].FoodId)) {
                ArrayFood.push(order[i].FoodId)
            }
        }
        console.log(111);
        console.log(ArrayFood);


        let resultId = [];
        let result = []
        let results = [];

        //查询num的总和
        for (let id of ArrayFood) {
            const num = await Orders.sum('num', {
                where: {
                    FoodId: id
                },
                paranoid: false
            })
            result.push({id, num})
        }
        console.log(result)
       
        return result;
    }
    let instance = {
        getFood: getFood,
    }
    return instance;
})();

module.exports = getFoodNum;