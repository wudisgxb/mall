var db = require('./index.js');
var co = require('co');

var util = require('util');
var tool = require('../../Tool/tool');

// var tenantId1 = tool.allocTenantId();
// var tenantId2 = tool.allocTenantId();
var tenantId1 = '68d473e77f459833bb06c60f9a8f4809';
var tenantId2 = '2cc4642a61354e4ed585390efce007f1';

function *addSuperAdminer() {
    yield db.models.Adminer.create({
        nickname: 'sss',
        name: '超级管理员',
        phone: '12345678901',
        password: '123456',
        status: 0,
        type: 100,
        tenantId: tenantId1
    });
    yield db.models.Adminer.create({
        nickname: 'hhh',
        name: '超级管理员',
        phone: '12345678901',
        password: '123456',
        status: 0,
        type: 100,
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
            tenantId: tenantId1
        });
    }

    yield db.models.Menus.create({
        name: '套餐',
        type: -1,
        tenantId: tenantId2
    });

    for (i = 1; i < 5; i++) {
        var tmp = yield db.models.Menus.create({
            name: '热销榜' + i,
            type: -1,
            tenantId: tenantId2
        });
    }
    yield db.models.Menus.create({
        name: '套餐',
        type: -1,
        tenantId: tenantId2
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
        var foods = yield db.models.Foods.create({
            name: '皮蛋瘦肉粥' + i,
            price: 2,
            oldPrice: 3,
            vipPrice: 1,
            unit: '份',
            description: '咸粥',
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
        address: '金润国际广场2楼雪花冰'
    });

    yield db.models.Address.create({
        province: '江苏省',
        city: '南京市',
        area: '建邺区',
        address: '金润国际广场-2楼辣尚瘾'
    });

    yield db.models.Address.create({
        province: '江苏省',
        city: '南京市',
        area: '建邺区',
        address: '金润国际广场-2楼麻辣盛宴'
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
            ConsigneeId: 1
        });
    }

    for (i = 0; i < 5; i++) {
        yield db.models.Tables.create({
            name: i + "号桌",
            status: 0,
            info: "双人桌",
            tenantId: tenantId1,
            ConsigneeId: 2
        });
    }

    for (i = 0; i < 5; i++) {
        yield db.models.Tables.create({
            name: i + "号桌",
            status: 0,
            info: "双人桌",
            tenantId: tenantId2,
            ConsigneeId: 1
        });
    }
    for (i = 0; i < 5; i++) {
        yield db.models.Tables.create({
            name: i + "号桌",
            status: 0,
            info: "双人桌",
            tenantId: tenantId2,
            ConsigneeId: 2
        });
    }
    yield db.models.Tables.create({
        name: 21 + "号桌",
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
        address: "双龙大道"
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
        address: "双龙大道"
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
        ConsigneeId: 1,
    });

    yield db.models.ProfitSharings.create({
        tenantId: tenantId1,
        merchantRemark: '麻辣盛宴代售-转账',
        consigneeRemark: '雪花冰-代售分润',
        rate: 0.2,
        ownRate: 0.1,
        ConsigneeId: 2,
    });

    yield db.models.Merchants.create({
        name: '辣尚瘾',
        phone: '13585130223',
        payee_account: '13585130223',
        wecharPayee_account: "oeGC00rSlKScZMw7g9Bz3xj5hrsc",
        AddressId: 2,
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
        ConsigneeId: 2,
    });
}

function * TenantConfigsSeed() {
    yield db.models.TenantConfigs.create({
        tenantId: tenantId1,
        payee_account: '13585130223',
        wecharPayee_account: "oeGC00rSlKScZMw7g9Bz3xj5hrsc",
        isRealTime: true,
        vipFee: 50,
        vipRemindFee:25,
        image:''
    });

    yield db.models.TenantConfigs.create({
        tenantId: tenantId2,
        payee_account: '13585130223',
        wecharPayee_account: "oeGC00rSlKScZMw7g9Bz3xj5hrsc",
        isRealTime: true,
        vipFee: 50,
        vipRemindFee:25,
        image:''
    });
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
    // yield AlipayConfigSeed();
    // yield ChildAlipayConfigSeed();
}

co(function *() {
    yield init();
    console.log('finished ...');
    process.exit(0)
}).catch(function () {
    console.log(arguments);
});
