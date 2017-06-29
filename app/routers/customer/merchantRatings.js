
var db = require('../../db/mysql/index');
let mer = require('../../controller/customer/merchantRatings')


module.exports = (router) => {

    var MerchantRatings = db.models.MerchantRatings;

    router.post('/api/v3/user/merchantRatings', mer.saveUserMerchantRatings);
    
    router.get('/api/v3/user/merchantRatings',mer.getusermerchantRatings);


};