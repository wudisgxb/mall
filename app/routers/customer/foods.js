
var db = require('../../db/mysql/index');
var sequelize = require('sequelize');

let foods = require('../../controller/customer/foods');



module.exports = (router) => {
    router.get('/api/v2/user/Menus',foods.getUserMenus);
    router.post('/api/v2/user/rating',foods.saveUserReting);
};