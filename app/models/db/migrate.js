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
        nickname:'sss',
        name: '超级管理员',
        phone: '12345678901',
        password: '123456',
        status: 0,
        type: 100,
        tenantId:tenantId1
    });
    yield db.models.Adminer.create({
        nickname:'hhh',
        name: '超级管理员',
        phone: '12345678901',
        password: '123456',
        status: 0,
        type: 100,
        tenantId:tenantId2
    });
}

function * adminerSeed(){
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

function * rankSeed(){
    for(var i = 0; i < 40; i ++) {
        yield db.models.Rank.create({
          name:"name"+i,
            min:10*i,
            max:(i+1)*10
        })
    }
}

function * commentSeed(){
    for(var i = 0; i < 40; i ++) {
        yield db.models.Comment.create({
            score:i%5,
            status:i%2,
            message:"message"+i,
            UserId:1,
            GoodId:1
        })
    }
}

function * userSeed(){
    for(var i = 0; i < 5; i ++) {
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

function * storeSeed() {
    var users = yield db.models.User.findAll();
    var stores = [];
    for(var i = 0; i < users.length / 2 ; i ++ ){
        var tmp = yield db.models.Store.create({
            username: 'username' + i,
            name: 'dianpu' + i,
            phone: '12345678901',
            status: i % 2,
            UserId: users[i].id,
            checkTime: ( i % 2 ) == 1 ? Date.now() : null,
        });
        stores.push(tmp);
    }
    var topStore;
    for(i = users.length / 2 ; i < users.length; i ++ ){
        topStore = stores[(i - users.length / 2)  % stores.length];
        yield db.models.Store.create({
            username: 'username' + i,
            name: 'dianpu' + i ,
            phone: '12345678901',
            status: i % 2,
            UserId: users[i].id,
            StoreId: topStore.id
        });
        topStore.inferiorNum ++;
        yield topStore.save();
    }
}

function * salerGoodsSeed() {
    var goods = yield db.models.Goods.findAll();
    var store = yield db.models.Store.findAll();

    for(var i = 0; i < 40; i ++) {
        yield db.models.SalerGoods.create({
            StoreId: store[i % store.length].id,
            GoodId: goods[i % goods.length].id
        });
    }
}

function * goodsSeed() {
    var goodsTypes = yield db.models.GoodsType.findAll({
        where: {
            type: 2
        },
        include: [{
            model: db.models.GoodsType,
            as: 'ParentType'
        }]
    });
    for(var i = 0; i < 40; i ++) {
        var type1 = goodsTypes[i % goodsTypes.length];
        var type2 = goodsTypes[(i + 1) % goodsTypes.length];
        var fields = JSON.parse(type1.fields).concat(JSON.parse(type1.ParentType.fields))
            .concat(JSON.parse(type2.fields).concat(JSON.parse(type2.ParentType.fields)));

        var extraFields = fields.map((field) => {
            return fillField(field, i);
        });

        var goods = yield db.models.Goods.create({
            title: '商品' + i,
            mainImg: `/images/goods${i}.jpg`,
            imgs: '[]',
            price: 20 + i,
            oldPrice: 10 + i,
            capacity: 20 + i,
            content: '内容' + i,
            baseSoldNum: i,
            compoundSoldNum: i,
            timeToDown: null,
            commission1: i * 5 /10 ,
            commission2: i * 4 / 10,
            commission3: i * 3 / 10,
            status: 1,
            extraFields: JSON.stringify(extraFields),
            buyLimit: i % 5
        });
        yield db.models.GoodsOfTypes.create({
            GoodId: goods.id,
            GoodsTypeId: type1.id
        });
        yield db.models.GoodsOfTypes.create({
            GoodId: goods.id,
            GoodsTypeId: type2.id
        });
        if (i % 2) {
            yield goods.destroy();
        }
    }

    function fillField(field, i) {
        switch(field.type) {
            case '0':
            case '1':
                return util._extend({"value": i}, field);
            case '2':
                return util._extend({"value": '2016-01-' + i}, field);
            case '3':
                return util._extend({"value": i}, field);
            case '4':
                return util._extend({"value": [i, i + 1, i + 2 ]}, field);
        }
    }
}

function diffDate() {
    for(var i = 1; i < 1000; i ++) {
        for(var j = 1; j < 3000; j ++) {

        }
    }
    return Date.now();
}

function * goodsTypeSeed() {
    var ids = [];
    var fields = [
        {
            title: "扩展属性"
        }
    ];
    for(var i = 1; i < 5; i ++) {
        var tmp = yield db.models.GoodsType.create({
            title: '一级类型' + i,
            type: 1,
            fields: JSON.stringify([
                {
                    title: '一级扩展属性1-'+i,
                    id: diffDate(),
                    type: '0',
                    options: []
                },
                {
                    title: '一级扩展属性2-'+i,
                    id: diffDate(),
                    type: '1',
                    options: []
                },
                {
                    title: '一级扩展属性3-'+i,
                    id: diffDate(),
                    type: '2',
                    options: []
                },
                {
                    title: '一级扩展属性4-'+i,
                    id: diffDate(),
                    type: '3',
                    options: ['1', '2', '3']
                },
                {
                    title: '一级扩展属性5-'+i,
                    id: diffDate(),
                    type: '4',
                    options: ['1', '2', '3']
                }
            ])
        });
        ids.push(tmp.id);
    }
    for(var j = 0; j < ids.length; j ++) {
        for(var i = 1; i < 5; i ++) {
            var tmp = yield db.models.GoodsType.create({
                title: '二级类型' + j + i,
                type: 2,
                GoodsTypeId: ids[j],
                fields: JSON.stringify([
                    {
                        title: '二级扩展属性1'+ j + i,
                        id: diffDate(),
                        type: '0',
                        options: []
                    },
                    {
                        title: '二级扩展属性2'+ j + i,
                        id: diffDate(),
                        type: '1',
                        options: []
                    },
                    {
                        title: '二级扩展属性3'+ j + i,
                        id: diffDate(),
                        type: '2',
                        options: []
                    },
                    {
                        title: '二级扩展属性4'+ j + i,
                        id: diffDate(),
                        type: '3',
                        options: ['1', '2', '3']
                    },
                    {
                        title: '二级扩展属性5'+ j + i,
                        id: diffDate(),
                        type: '4',
                        options: ['1', '2', '3']
                    }
                ])
            });
        }
    }

}


function * addressSeed() {
    var users = yield db.models.User.findAll({});
    var defaults = {};
    for(var i = 0; i < 160; i ++) {
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

function * identitySeed() {
    var users = yield db.models.User.findAll({});
    var defaults = {};
    for(var i = 0; i < 160; i ++) {
        yield db.models.Identity.create({
            name: '备案人' + i,
            phone: "1884082390" + i % 10,
            identityNum: "12345678901234567" + i % 10,
            isDefault: defaults[users[i % users.length].id] ? false : true,
            UserId: users[i % users.length].id
        });
        defaults[users[i % users.length].id] = true;
    }
}

function * containerSeed() {
    yield db.models.Container.overduetime(30);
    yield db.models.Container.autoaccepttime(15);
    yield db.models.Container.extendaccepttime(3);
}

function * shoppingCartSeed() {
    var users = yield db.models.User.findAll({});
    var goods = yield db.models.Goods.findAll({});
    var salerGoods = yield db.models.SalerGoods.findAll({});
    for(var i = 0; i < users.length; i ++) {
        for(var j = 0 ; j < goods.length && j < 5; j ++) {
            s = yield db.models.ShoppingCart.create({
                num: i + j + 1,
                UserId: users[i % users.length].id,
                GoodId: goods[j % goods.length].id,
                type: 0,
            });
        }
        for(var j = 0 ; j < salerGoods.length && j < 5; j ++) {
            s = yield db.models.ShoppingCart.create({
                num: i + j + 1,
                UserId: users[i % users.length].id,
                SalerGoodId: salerGoods[j % salerGoods.length].id,
                type: 1
            });
        }
    }
}

function * collectionSeed() {
    var users = yield db.models.User.findAll({});
    var goods = yield db.models.Goods.findAll({});
    var salerGoods = yield db.models.SalerGoods.findAll({});
    for(var i = 0; i < users.length; i ++) {
        for(var j = 0 ; j < goods.length && j < 5; j ++) {
            s = yield db.models.GoodsCollection.create({
                UserId: users[i % users.length].id,
                GoodId: goods[j % goods.length].id,
                type: 0,
            });
        }
        for(var j = 0 ; j < salerGoods.length && j < 5; j ++) {
            s = yield db.models.GoodsCollection.create({
                UserId: users[i % users.length].id,
                SalerGoodId: salerGoods[j % salerGoods.length].id,
                type: 1
            });
        }
    }
}

function * orderSeed() {

    var users = yield db.models.User.findAll({});
    var goods = yield db.models.Goods.findAll({});
    var stores = yield db.models.Store.findAll({});
    for(var i = 0; i < users.length && i < 10; i ++) {
        for(var j = 0 ; j < 10; j ++) {
            //console.log('j:', j);
            var items = [];
            var price = 0;
            var type = j % 2;
            var num = 0;
            var store = stores[i % stores.length];
            var salerGoods = yield db.models.SalerGoods.findAll({
                where: {
                    StoreId: store.id
                },
                include: [db.models.Goods]
            });
            for(var k = 0 ; k < (i + j % 10) + 1 && k < 5; k ++ ){
                //console.log('k:', k);
                var goodsItem = type  == 0 ? goods[(i+j+k) % goods.length] : salerGoods[(i+j+k) % salerGoods.length].Good;
                price += ((i + j % 10) + 1) * goodsItem.price;
                items.push(db.models.OrderItem.build({
                    goods: JSON.stringify(goodsItem),
                    price: ((i + j % 10) + 1) * goodsItem.price,
                    num: (i + j % 10) + 1,
                    type,
                    SalerGoodId: type == 1 ? goodsItem.id : null,
                    GoodId: type == 0 ? goodsItem.id : null
                }));
                num += (i + j % 10) + 1;
            }
            var status = (i + j) % 4;
            var returnStatus = (i + j) % 2;
            var order = yield db.models.Order.create({
                recieverName: '收货人' + i,
                phone: "1884082391" + i % 10,
                province: '辽宁省',
                city: '大连市',
                area: '开发区',
                address: '大连理工大学软件学院',
                identityName: '备案人',
                identityPhone: "1884082391" + i % 10,
                identityNum: "12345678901234567" + i % 10,
                price,
                num: items.length,
                goodsNum: num,
                status,
                exressWay: j % 2,
                message: '留言啊',
                UserId: users[i % users.length].id,
                type: type,
                StoreId: type == 1 ? store.id : null,
                payTime: status != 0 ? Date.now() : null,
                sendTime: status == 2 ? Date.now() : null,
                recieveTime: status == 10 && returnStatus == 0 ? Date.now() : null,
                returnStatus,
                returnRequestTime: returnStatus == 1 ? Date.now() : null,
                returnTime: returnStatus == 2 ? Date.now() : null
            });
            for(var k = 0 ; k < items.length; k ++ ){
                items[k].OrderId = order.id;
                yield items[k].save();
            }
        }
    }
}

function * slideshowSeed() {
    for(var i = 0; i < 3; i ++ ){
        yield db.models.Slideshow.create({
            link: '/user/center',
            address: '/images/' + ((i % 3) + 1) + '.png'
        });
    }
}

function * MenusSeed() {
    for(var i = 1; i < 5; i ++) {
        var tmp = yield db.models.Menus.create({
            name: '热销榜' + i,
            type: -1,
            tenantId:tenantId1
        });
    }

    yield db.models.Menus.create({
        name: '套餐',
        type: -1,
        tenantId:tenantId2
    });

    for(i = 1; i < 5; i ++) {
        var tmp = yield db.models.Menus.create({
            name: '热销榜' + i,
            type: -1,
            tenantId:tenantId2
        });
    }
    yield db.models.Menus.create({
        name: '套餐',
        type: -1,
        tenantId:tenantId2
    });
}

function * FoodsSeed() {
    var menus = yield db.models.Menus.findAll({
        where:{
            tenantId:tenantId1
        }
    });
    for(var i = 0; i < 10; i ++) {
        var type1 = menus[i % menus.length];
      //  var type2 = menus[(i + 1) % menus.length];
        var foods = yield db.models.Foods.create({
            name: '皮蛋瘦肉粥' + i,
            price: 2,
            oldPrice: 3,
            vipPrice: 1,
            unit:'份',
            description: '咸粥',
            sellCount: 100 + i,
            rating: 100 - 2 * i,
            info: '一碗皮蛋瘦肉粥，总是我到粥店时的不二之选。香浓软滑，饱腹暖心，皮蛋的Q弹与瘦肉的滑嫩伴着粥香溢于满口，让人喝这样的一碗粥也觉得心满意足',
            icon: 'http://fuss10.elemecdn.com/c/cd/c12745ed8a5171e13b427dbc39401jpeg.jpeg?imageView2/1/w/114/h/114',
            image: 'http://fuss10.elemecdn.com/c/cd/c12745ed8a5171e13b427dbc39401jpeg.jpeg?imageView2/1/w/750/h/750',
            isActive:true,
            tenantId:tenantId1
        });
        yield db.models.FoodsOfTMenus.create({
            FoodId: foods.id,
            MenuId: type1.id,
            tenantId:tenantId1
        });
    }


    menus = yield db.models.Menus.findAll({
        where:{
            tenantId:tenantId2
        }
    });
    for(i = 0; i < 10; i ++) {
        var type1 = menus[i % menus.length];
        //  var type2 = menus[(i + 1) % menus.length];
        var foods = yield db.models.Foods.create({
            name: '皮蛋瘦肉粥' + i,
            price: 2,
            oldPrice: 3,
            vipPrice: 1,
            unit:'份',
            description: '咸粥',
            sellCount: 100 + i,
            rating: 100 - 2 * i,
            info: '一碗皮蛋瘦肉粥，总是我到粥店时的不二之选。香浓软滑，饱腹暖心，皮蛋的Q弹与瘦肉的滑嫩伴着粥香溢于满口，让人喝这样的一碗粥也觉得心满意足',
            icon: 'http://fuss10.elemecdn.com/c/cd/c12745ed8a5171e13b427dbc39401jpeg.jpeg?imageView2/1/w/114/h/114',
            image: 'http://fuss10.elemecdn.com/c/cd/c12745ed8a5171e13b427dbc39401jpeg.jpeg?imageView2/1/w/750/h/750',
            isActive:true,
            tenantId:tenantId2
        });
        yield db.models.FoodsOfTMenus.create({
            FoodId: foods.id,
            MenuId: type1.id,
            tenantId:tenantId2
        });
    }
}

function * RatingsSeed() {
    var foods = yield db.models.Foods.findAll({});
    for(var k = 0; k < foods.length; k ++) {
        for (var i = 0; i < 10; i++) {
            var type1 = foods[k];
            yield db.models.Ratings.create({
                username: 'sssssssssss' + i,
                rateTime: Date.now(),
                text: '好吃' + i,
                avatar: "http://static.galileo.xiaojukeji.com/static/tms/default_header.png",
                FoodId: type1.id,
                tenantId:tenantId1
            });
        }
    }
}

function * TablesSeed() {
    for(var i = 0; i < 5; i ++) {
        var j = i+1;
        yield db.models.Tables.create({
            name:  j + "号桌",
            status : 0,
            info:"双人桌",
            tenantId:tenantId1
        });
    }

    for(i = 0; i < 5; i ++) {
        yield db.models.Tables.create({
            name:  i + "号桌",
            status : 0,
            info:"双人桌",
            tenantId:tenantId2
        });
    }
}

function * AlipayConfigSeed() {
     yield db.models.AlipayConfigs.create({
        merchant: '辣尚瘾',
        payee_account: '13585130223',
         wecharPayee_account :"oeGC00rSlKScZMw7g9Bz3xj5hrsc",
        payee_real_name: '官绪斌',
        remark:'测试单笔转账-非代售',
        isRealTime:true,
        tenantId:tenantId1
    });

     yield db.models.AlipayConfigs.create({
        merchant: '雪花冰',
        payee_account: '806802194@qq.com',
         wecharPayee_account :"oeGC00rSlKScZMw7g9Bz3xj5hrsc",
        payee_real_name: '官绪斌',
        remark:'测试单笔转账-非代售',
        isRealTime:true,
        tenantId:tenantId2
    });
}

function * ChildAlipayConfigSeed() {
    var alipayConfigs = yield db.models.AlipayConfigs.findAll({});

    var childAlipayConfig1= yield db.models.ChildAlipayConfigs.create({
        merchant: '辣尚瘾',
        payee_account: "806802194@qq.com",
        wecharPayee_account :"oeGC00rSlKScZMw7g9Bz3xj5hrsc",
        payee_real_name: '官绪斌',
        remark:'测试单笔转账-代售1',
        rate : 0.1,
        ownRate:0.2,
        tenantId:tenantId1
    });
    yield db.models.RelationshipOfAlipays.create({
        AlipayConfigId: alipayConfigs[0].id,
        ChildAlipayConfigId: childAlipayConfig1.id,
        tenantId:tenantId1
    });

    childAlipayConfig1= yield db.models.ChildAlipayConfigs.create({
        merchant: '麻辣盛宴',
        payee_account: "806802194@qq.com",
        wecharPayee_account :"oeGC00rSlKScZMw7g9Bz3xj5hrsc",
        payee_real_name: '官绪斌',
        remark:'测试单笔转账-代售1',
        rate : 0.1,
        ownRate:0.2,
        tenantId:tenantId1
    });
    yield db.models.RelationshipOfAlipays.create({
        AlipayConfigId: alipayConfigs[0].id,
        ChildAlipayConfigId: childAlipayConfig1.id,
        tenantId:tenantId1
    });

    var childAlipayConfig2 = yield db.models.ChildAlipayConfigs.create({
        merchant: '辣尚瘾',
        payee_account: "13721080281",
        wecharPayee_account :"oeGC00pAyM4kmJzjmt-asY73fDsA",
        payee_real_name: '管靖',
        remark:'测试单笔转账-代售2',
        rate : 0.2,
        ownRate:0.1,
        tenantId:tenantId2
    });
    yield db.models.RelationshipOfAlipays.create({
        AlipayConfigId: alipayConfigs[1].id,
        ChildAlipayConfigId: childAlipayConfig2.id,
        tenantId:tenantId2
    });
    childAlipayConfig2 = yield db.models.ChildAlipayConfigs.create({
        merchant: '麻辣盛宴',
        payee_account: "13721080281",
        wecharPayee_account :"oeGC00pAyM4kmJzjmt-asY73fDsA",
        payee_real_name: '管靖',
        remark:'测试单笔转账-代售2',
        rate : 0.2,
        ownRate:0.1,
        tenantId:tenantId2
    });
    yield db.models.RelationshipOfAlipays.create({
        AlipayConfigId: alipayConfigs[1].id,
        ChildAlipayConfigId: childAlipayConfig2.id,
        tenantId:tenantId2
    });


}

function * init() {
    yield db.sync({
        force: true
    });
    yield userSeed();
    yield adminerSeed();
    // yield storeSeed();
    // yield goodsTypeSeed();
    // yield goodsSeed();
    //
    // yield salerGoodsSeed();
    // yield shoppingCartSeed();
    // //yield msgSeed();
    // yield addressSeed();
    // yield identitySeed();
    // yield containerSeed();
    // //yield orderSeed();
    // yield commentSeed();
    // yield rankSeed();
    // yield collectionSeed();
    // yield slideshowSeed();

    //gxb 点菜
    yield MenusSeed();
    yield FoodsSeed();
    yield RatingsSeed();

    yield TablesSeed();

    //支付配置预置值
     yield AlipayConfigSeed();
     yield ChildAlipayConfigSeed();
}

co(function * () {
    yield init();
    console.log('finished ...');
    process.exit(0)
}).catch(function () {
    console.log(arguments);
});
