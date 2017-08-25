let db = require('../../../db/mysql/index');
let Customers = db.models.Customers


let customerSql = (function () {
    let getcustomer = async function (whereJson){
        let customer = await Customers.findAll({
            where: whereJson
        })
        console.log(customer)
        return customer
    }
    let getCustomerOne = async function (whereJson){
        let customer = await Customers.findOne({
            where: whereJson
        })
        console.log(customer)
        return customer
    }


    let savecustomer = async function (whereJson){
         await Customers.create(whereJson)
    }

    let instance = {
        getcustomer: getcustomer,
        getCustomerOne : getCustomerOne,
        savecustomer : savecustomer
    }
    return instance;
})();
module.exports = customerSql;

