// const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
// const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
let Foods = db.models.Foods;

let getFoodNum = require('../../controller/statistics/statistics');

module.exports = {
    async saveInStock(ctx,next){

    },
}


