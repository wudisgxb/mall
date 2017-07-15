const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
let Orders = db.models.Orders;
let HotSaleFood = db.models.HotSaleFood;
let Foods = db.models.Foods;


const getFoodNum = (function () {

    let getFood = async function (tenantId, foodnums) {

        let ArrayFood = [];

        let lastDate = new Date()
        lastDate.setDate(0);
        let b = lastDate.format("yyyy-MM-dd 23:59:59");

        let firstDate = new Date();
        firstDate.setDate(0);
        firstDate.setDate(0)
        let a = firstDate.format("yyyy-MM-dd 23:59:59");

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
        getFood: getFood
    }
    return instance;
})();
module.exports = getFoodNum;