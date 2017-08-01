var db = require('./index.js');
var dbstatistic = require("../statisticsMySql/index")
var co = require('co');

var util = require('util');
var tool = require('../../Tool/tool');

// var tenantId1 = tool.allocTenantId();
// var tenantId2 = tool.allocTenantId();
var tenantId1 = 'tenantId1';
var tenantId2 = 'tenantId2';

var consigneeId1 = 'consigneeId1';
var consigneeId2 = 'consigneeId2';

function *addSuperAdminer() {
    yield db.models.Adminer.create({
        nickname: 'sss',
        name: '超级管理员',
        phone: '12345678901',
        password: '123456',
        status: 0,
        type: 100,
        tenantType: "租户",
        tenantId: tenantId1
    });
    yield db.models.Adminer.create({
        nickname: 'hhh',
        name: '超级管理员',
        phone: '12345678901',
        password: '123456',
        status: 0,
        type: 100,
        tenantType: "代售点",
        tenantId: tenantId2
    });
}

function * adminerSeed() {
    yield addSuperAdminer();
    // for(var i = 0; i < 5; i ++) {
    //     yield db.models.Adminer.create({
    //         name: '用户' + i,
    //         password: '123456',
    //         phone: '18840823910',
    //         nickname: '用户' + i,
    //         type: i % 4 + 1,
    //         tenantId:tenantId1
    //     })
    // }
}

function getphone() {
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

function name() {
    let randomName = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"]
    let nameLength = Math.ceil(Math.random()*10)
    let names;
    for(let i = 0; i<nameLength.length;i++){
        let name = randomName[Math.ceil(Math.random()*(randomName.length-1))];
        names=names+name
    }
    return names
}

function * Vip() {
     let order = yield dbstatistic.models.Order.findAll({
         where:{
             tenantId : "67117f7549025df34395e23893c7b18e"
         }
     });

    for(let i = 0; i < order.length; i++ ){
        if(order[i].totalPrice>=300){
            let vipName = name();
            yield db.models.Vips.create({
                phone : order[i].phone,
                vipLevel : order[i].totalPrice<500?((order[i].totalPrice<400)?1:2):((order[i].totalPrice<600)?3:4) ,
                vipName : vipName,
                tenantId:"67117f7549025df34395e23893c7b18e"
            })
        }
    }
}

function * Coupons() {
    // var Order = yield db.models.Order.findAll({});
    var defaults = {};
    // const days = generateDays(200)

    for (var i = 0; i < 200; i++) {
        let phones = phone();

        // let phone = body.phoneNumber;

        // let trade_no = new Date().format("yyyyMMddhhmmssS") + parseInt(Math.random() * 8999 + 1000) + 6;

        // let price = Math.random()
        let admins = yield db.models.Adminer.findAll({})
        let tenantIdRandom = Math.ceil(Math.random()*(admins.length-1))
        let tenantId = tenantId[tenantIdRandom].tenantId

        // 根据得到的随机tenantId在分润表中找到对应的consigneeId信息
        let profitSharings = yield db.models.ProfitSharings.findAll({
            where:{
                tanantId:tenantId
            }
        })
        let consigneeId = null
        if(profitSharings!=null){
            let consigneeIdRandom = Math.ceil(Math.random()*(consignees.length-1))
            consigneeId = profitSharings[consigneeIdRandom].consigneeId
        }


        let valueRandom = Math.ceil(Math.random()*3+1)
        let value = valueRandom*10

        let couponTypeRandom = Math.ceil(Math.random()*1)

        let statusRandom = Math.ceil(Math.random()*1+1)

        let phone = getphone();
        yield db.models.Coupons.create({
            couponkey: testkey+(i+10),
            tenantId: tenantId,
            consigneeId:consigneeId,
            couponType: couponTypeRandom==0?"金额":"折扣",
            value: value,
            status: statusRandom,
            phone: phone,
            trade_no:null,
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

function * userSeed() {
    for (var i = 0; i < 5; i++) {
        yield db.models.User.create({
            password: '123456',
            phone: '12345678901',
            nickname: '用户' + i,
            headimgurl: 'http://img3.shijue.cvidea.cn/tf/150613/2390340/557c39ae3dfae918de000001.JPEG',
            sex: i % 2 + 1,
            unionid: 'unionid',
            openid: 'openid',
            joinTime: Date.now()
        });
    }
}

function * MenusSeed() {
    for (var i = 1; i < 5; i++) {
        var tmp = yield db.models.Menus.create({
            name: '热销榜' + i,
            type: -1,
            tenantId: tenantId1,
            sort: i
        });
    }

    yield db.models.Menus.create({
        name: '套餐',
        type: -1,
        tenantId: tenantId2,
        sort: i
    });

    for (i = 1; i < 5; i++) {
        var tmp = yield db.models.Menus.create({
            name: '热销榜' + i,
            type: -1,
            tenantId: tenantId2,
            sort: i
        });
    }
    yield db.models.Menus.create({
        name: '套餐',
        type: -1,
        tenantId: tenantId1,
        sort: i
    });
}

function * FoodsSeed() {
    var menus = yield db.models.Menus.findAll({
        where: {
            tenantId: tenantId1
        }
    });
    for (var i = 0; i < 10; i++) {
        var type1 = menus[i % menus.length];
        //  var type2 = menus[(i + 1) % menus.length];
        var foods = yield db.models.Foods.create({
            name: '皮蛋瘦肉粥' + i,
            price: 2,
            oldPrice: 3,
            vipPrice: 1,
            unit: '份',
            foodNum:1000,
            description: '咸粥',
            sellCount: 100 + i,
            rating: 100 - 2 * i,
            info: '一碗皮蛋瘦肉粥，总是我到粥店时的不二之选。香浓软滑，饱腹暖心，皮蛋的Q弹与瘦肉的滑嫩伴着粥香溢于满口，让人喝这样的一碗粥也觉得心满意足',
            icon: 'http://fuss10.elemecdn.com/c/cd/c12745ed8a5171e13b427dbc39401jpeg.jpeg?imageView2/1/w/114/h/114',
            image: 'http://fuss10.elemecdn.com/c/cd/c12745ed8a5171e13b427dbc39401jpeg.jpeg?imageView2/1/w/750/h/750',
            isActive: true,
            tenantId: tenantId1
        });
        yield db.models.FoodsOfTMenus.create({
            FoodId: foods.id,
            MenuId: type1.id,
            tenantId: tenantId1
        });
    }


    menus = yield db.models.Menus.findAll({
        where: {
            tenantId: tenantId2
        }
    });
    for (i = 0; i < 10; i++) {
        var type1 = menus[i % menus.length];
        //  var type2 = menus[(i + 1) % menus.length];
        var arr = ['麻辣', '超辣', '微辣'];
        var foods = yield db.models.Foods.create({
            name: '皮蛋瘦肉粥' + i,
            price: 2,
            oldPrice: 3,
            vipPrice: 1,
            taste: JSON.stringify(arr),
            unit: '份',
            description: '咸粥',
            foodNum:1000,
            sellCount: 100 + i,
            rating: 100 - 2 * i,
            info: '一碗皮蛋瘦肉粥，总是我到粥店时的不二之选。香浓软滑，饱腹暖心，皮蛋的Q弹与瘦肉的滑嫩伴着粥香溢于满口，让人喝这样的一碗粥也觉得心满意足',
            icon: 'http://fuss10.elemecdn.com/c/cd/c12745ed8a5171e13b427dbc39401jpeg.jpeg?imageView2/1/w/114/h/114',
            image: 'http://fuss10.elemecdn.com/c/cd/c12745ed8a5171e13b427dbc39401jpeg.jpeg?imageView2/1/w/750/h/750',
            isActive: true,
            tenantId: tenantId2
        });
        yield db.models.FoodsOfTMenus.create({
            FoodId: foods.id,
            MenuId: type1.id,
            tenantId: tenantId2
        });
    }
}

function * RatingsSeed() {
    var foods = yield db.models.Foods.findAll({});
    for (var k = 0; k < foods.length; k++) {
        for (var i = 0; i < 10; i++) {
            var type1 = foods[k];
            yield db.models.Ratings.create({
                username: 'sssssssssss' + i,
                rateTime: Date.now(),
                text: '好吃' + i,
                avatar: "http://static.galileo.xiaojukeji.com/static/tms/default_header.png",
                FoodId: type1.id,
                tenantId: tenantId1
            });
        }
    }
}

function * AddressSeed() {
    yield db.models.Address.create({
        province: '江苏省',
        city: '南京市',
        area: '建邺区',
        address: '金润国际广场2楼雪花冰',
        tenantId: tenantId1
    });

    yield db.models.Address.create({
        province: '江苏省',
        city: '南京市',
        area: '建邺区',
        address: '金润国际广场-2楼辣尚瘾',
        tenantId: tenantId2
    });

    yield db.models.Address.create({
        province: '江苏省',
        city: '南京市',
        area: '建邺区',
        address: '金润国际广场-2楼辣尚瘾',
        tenantId: consigneeId1
    });

    yield db.models.Address.create({
        province: '江苏省',
        city: '南京市',
        area: '建邺区',
        address: '金润国际广场-2楼麻辣盛宴',
        tenantId: consigneeId2
    });
}

function * TablesSeed() {
    for (var i = 0; i < 5; i++) {
        var j = i + 1;
        yield db.models.Tables.create({
            name: j + "号桌",
            status: 0,
            info: "双人桌",
            tenantId: tenantId1,
            consigneeId: consigneeId1
        });
    }

    for (i = 0; i < 5; i++) {
        yield db.models.Tables.create({
            name: i + "号桌",
            status: 0,
            info: "双人桌",
            tenantId: tenantId1,
            consigneeId: consigneeId2
        });
    }

    for (i = 0; i < 5; i++) {
        yield db.models.Tables.create({
            name: i + "号桌",
            status: 0,
            info: "双人桌",
            tenantId: tenantId2,
            consigneeId: consigneeId1
        });
    }
    for (i = 0; i < 5; i++) {
        yield db.models.Tables.create({
            name: i + "号桌",
            status: 0,
            info: "双人桌",
            tenantId: tenantId2,
            consigneeId: consigneeId2
        });
    }
    yield db.models.Tables.create({
        name: 1 + "号桌",
        status: 0,
        info: "双人桌",
        tenantId: tenantId1
    });

}

function * Consigneeseed() {
    yield db.models.Consignees.create({
        name: '辣尚瘾',
        phone: '13585130223',
        payee_account: '13585130223',
        wecharPayee_account: "oeGC00rSlKScZMw7g9Bz3xj5hrsc",
        address: "双龙大道",
        consigneeId: consigneeId1
        // payee_real_name: '官绪斌',
        // remark:'测试单笔转账-非代售',
        //isRealTime:true,
        //tenantId:tenantId1
    });

    yield db.models.Consignees.create({
        name: '麻辣盛宴',
        phone: '13585130223',
        payee_account: '13585130223',
        wecharPayee_account: "oeGC00rSlKScZMw7g9Bz3xj5hrsc",
        address: "双龙大道",
        consigneeId: consigneeId2
        // payee_real_name: '官绪斌',
        // remark:'测试单笔转账-非代售',
        //isRealTime:true,
        //tenantId:tenantId1
    });
}

function * Merchantseed() {
    yield db.models.Merchants.create({
        name: '雪花冰',
        phone: '13585130223',
        payee_account: '13585130223',
        wecharPayee_account: "oeGC00rSlKScZMw7g9Bz3xj5hrsc",
        AddressId: 1,
        needOrderConfirmPage: false,
        // payee_real_name: '官绪斌',
        // remark:'测试单笔转账-非代售',
        //isRealTime:true,
        tenantId: tenantId1
    });

    var arr = [1, 2, 3];
    yield db.models.ProfitSharings.create({
        tenantId: tenantId1,
        merchantRemark: '辣尚瘾代售-转账',
        consigneeRemark: '雪花冰-代售分润',
        rate: 0.2,
        ownRate: 0.1,
        excludeFoodId: JSON.stringify(arr),
        consigneeId: consigneeId1,
    });

    yield db.models.ProfitSharings.create({
        tenantId: tenantId1,
        merchantRemark: '麻辣盛宴代售-转账',
        consigneeRemark: '雪花冰-代售分润',
        rate: 0.2,
        ownRate: 0.1,
        consigneeId: consigneeId2,
    });

    yield db.models.Merchants.create({
        name: '辣尚瘾',
        phone: '13585130223',
        payee_account: '13585130223',
        wecharPayee_account: "oeGC00rSlKScZMw7g9Bz3xj5hrsc",
        AddressId: 2,
        needOrderConfirmPage: true,
        // payee_real_name: '官绪斌',
        // remark:'测试单笔转账-非代售',
        //isRealTime:true,
        tenantId: tenantId2
    });

    arr = [19, 20]
    yield db.models.ProfitSharings.create({
        tenantId: tenantId2,
        merchantRemark: '麻辣盛宴代售-转账',
        consigneeRemark: '辣尚瘾-代售分润',
        rate: 0.2,
        ownRate: 0.1,
        excludeFoodId: JSON.stringify(arr),
        consigneeId: consigneeId2,
    });
}

function * TenantConfigsSeed() {
    yield db.models.TenantConfigs.create({
        tenantId: tenantId1,
        name: '雪花冰',
        payee_account: '13585130223',
        wecharPayee_account: "oeGC00rSlKScZMw7g9Bz3xj5hrsc",
        isRealTime: true,
        needVip: true,
        vipFee: 50,
        vipRemindFee: 25,
        homeImage: 'http://fuss10.elemecdn.com/c/cd/c12745ed8a5171e13b427dbc39401jpeg.jpeg?imageView2/1/w/750/h/750',
        startTime: '9:00',
        endTime: '18:30'
    });

    yield db.models.TenantConfigs.create({
        tenantId: tenantId2,
        name: '辣尚瘾',
        payee_account: '13585130223',
        wecharPayee_account: "oeGC00rSlKScZMw7g9Bz3xj5hrsc",
        isRealTime: true,
        needVip: true,
        vipFee: 50,
        vipRemindFee: 25,
        homeImage: 'http://fuss10.elemecdn.com/c/cd/c12745ed8a5171e13b427dbc39401jpeg.jpeg?imageView2/1/w/750/h/750',
        startTime: '9:00',
        endTime: '18:30'
    });
}

function * paymentReqSeed() {
    for (var i = 200; i > 0; i--) {
        var date = new Date() - Math.round(i / 20) * 86400000
        if (i % 3 == 0) {
            yield db.models.PaymentReqs.create({
                params: '',
                tableId: 1,
                paymentMethod: '支付宝',
                isFinish: i % 2,
                isInvalid: 0,
                trade_no: '2017',
                app_id: 'appId',
                total_amount: '100',
                actual_amount: parseInt(Math.random() * 10 + 5),
                refund_amount: '0',
                refund_reason: '',
                consigneeId: consigneeId1,
                phoneNumber: '13585130223',
                TransferAccountIsFinish: true,
                consigneeTransferAccountIsFinish: false,
                tenantId: tenantId1,
                createdAt: date
            });
        } else {
            yield db.models.PaymentReqs.create({
                params: '',
                tableId: 1,
                paymentMethod: '支付宝',
                isFinish: true,
                isInvalid: 0,
                trade_no: '2017',
                app_id: 'appId',
                total_amount: '100',
                actual_amount: parseInt(Math.random() * 10 + 5),
                refund_amount: '0',
                refund_reason: '',
                consigneeId: consigneeId2,
                phoneNumber: '13585130223',
                TransferAccountIsFinish: true,
                consigneeTransferAccountIsFinish: false,
                tenantId: tenantId1,
                createdAt: date
            });
        }

    }
}

function * couponLimitSeed() {
    yield db.models.CouponLimits.create({
        couponLimitKey: 'testKey',//优惠券限制唯一标识
        tenantId: 'tenantId1',
        consigneeId: 'consigneeId1',
        timeLimit: 86400000,//时间使用限制
        numLimit: 10,//领用次数限制
        invalidTime: 86400000 * 30,//失效时间限制
    });
}

function * couponSeed() {
    for (var i = 0; i < 10; i++) {
        yield db.models.Coupons.create({
            couponKey: "testkey" + i,
            tenantId: 'tenantId1',
            consigneeId: 'consigneeId1',
            couponType: '金额',
            value: '5',
            status: 0,
            phone: '13585130223',
        });
    }
}

function * init() {
    yield db.sync({
        force: true
    });
    //yield userSeed();


    yield adminerSeed();

    yield AddressSeed();
    yield Consigneeseed();
    yield Merchantseed();

    yield TenantConfigsSeed();

    yield TablesSeed();


    //gxb 点菜
    yield MenusSeed();
    yield FoodsSeed();
    yield RatingsSeed();


    //支付配置预置值
    yield paymentReqSeed();

    //优惠券限制预置值
    yield couponLimitSeed();

    //优惠券预置值
    yield couponSeed();
}

function * update() {
    yield db.sync({
        force: false
    });
}

co(function *() {
    //yield init();
    // yield update();
    yield Vip
    yield Coupons();

    console.log('finished ...');
    process.exit(0)
}).catch(function () {
    console.log(arguments);
});
