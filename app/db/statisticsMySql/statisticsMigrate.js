var db = require('./index.js');
var co = require('co');

var util = require('util');
var tool = require('../../Tool/tool');
var start = new Date('2017-07-01 10:11:34').getTime()

var minMills = 1.8 * 60 * 60 * 1000
var maxMills = 2.1 * 60 * 60 * 1000


function * init() {
    yield db.sync({
        force: true
    });
    //yield userSeed();

}

function * update() {
    yield db.sync({
        force: false
    });
}

function phone() {
    let last = ["0","1","2","3","4","5","6","7","8","9"]
    let second = ["3","4","5","8"]
    let third=["0","1","2","3","4","5","6","7","8","9"]
    let secondisEight = ["2","6","7","8","9"]
    let secondisfire = ["5","7"]
    let secondPhone = second[Math.ceil(Math.random()*3)];
    let thirdPhone;
    if(secondPhone=="3"||secondPhone=="5"){
         thirdPhone = third[Math.ceil(Math.random()*9)];
    }
    if(secondPhone=="8"){
        thirdPhone = secondisEight[Math.ceil(Math.random()*4)];
    }
    if(secondPhone=="4"){
        thirdPhone = secondisfire[Math.ceil(Math.random()*1)];
    }
    let lastPhone=0;
    for(let i = 0;i<7;i++){
        lastPhone += last[Math.ceil(Math.random()*9)];
    }

    let phone = 1+""+secondPhone+thirdPhone+""+lastPhone
    return phone;
}

function generateDays(length) {
    return generateMills(length).map(e => new Date(e+start))
        .map(e => {
            const hour = e.getHours()
            if (hour < 9) {
                e.setHours(hour+9)
            }
            return e
        })
        .map(e =>　e.toString())
}

function getRandom(min, max) {
    return Math.round(Math.random() * (max - min + 1)) + min
}

function generateMills(length) {
    const result = [0]
    for (let i = 0; i < length - 1; i += 1) {
        result.push(result[i] + getRandom(minMills, maxMills))
    }
    return result
}

function * deletestatistic() {
    let order = yield db.models.Orders.findAll({
        where:{
            tenantId:"67117f7549025df34395e23893c7b18e",
            // createTime:null
        }
    })
    for(let i =0;i<order.length;i++){
        yield order[i].destroy({force:true})
    }
    // order.destroy({force:true})
}

function * orderstatistic() {
    // var Order = yield db.models.Order.findAll({});
    var defaults = {};
    const days = generateDays(200)

    for (var i = 0; i < 200; i++) {
        let phones = phone();

        // let phone = body.phoneNumber;

        let trade_no = new Date().format("yyyyMMddhhmmssS") + parseInt(Math.random() * 8999 + 1000) + 6;

        let price = Math.round(Math.random()*80)+50
        yield db.models.Orders.create({
            trade_no: trade_no,
            tenantId: "67117f7549025df34395e23893c7b18e",
            totalPrice: price.toFixed(2)+"",//总价格
            merchantAmount: (price*0.9).toFixed(2)+"",
            consigneeAmount: "0",
            platformAmount: (price*0.1).toFixed(2)+"",
            deliveryFee: "0",//配送费
            refund_amount:"0",//退款
            platformCouponFee : "0",
            merchantCouponFee: "0",//商家优惠
            phone: phones,
            createTime:days[i],
        })
    }
}

function * addressSeed() {
    var users = yield db.models.User.findAll({});
    var defaults = {};
    for (var i = 0; i < 160; i++) {
        yield db.models.DeliverAddress.create({
            recieverName: '收货人' + i,
            phone: "1884082391" + i % 10,
            province: '辽宁省',
            city: '大连市',
            area: '开发区',
            address: '大连理工大学软件学院',
            isDefault: defaults[users[i % users.length].id] ? false : true,
            UserId: users[i % users.length].id,
        });
        defaults[users[i % users.length].id] = true;
    }
}

co(function *() {
    //yield init();
    // yield update();
    
    // yield orderstatistic();
    yield deletestatistic()

    console.log('finished ...');
    process.exit(0)
}).catch(function () {
    console.log(arguments);
});
