
var db = require('../../db/mysql/index');
var sequelize = require('sequelize');

let foods = require('../../controller/customer/foods');



module.exports = (router) => {
    router.get('/api/v3/user/Menus',foods.getUserMenus);
    router.post('/api/v3/user/rating',foods.saveUserReting);
};