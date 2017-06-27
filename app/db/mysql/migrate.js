var db = require('./index.js')
var co = require('co')

var util = require('util')

function* addSuperAdminer() {
  yield db.models.Admin.create({
    nickname: 'super',
    name: '超级管理员',
    phone: '12345678901',
    password: '123456',
    status: 0,
    type: 100
  })
}

function* adminerSeed() {
  yield addSuperAdminer()
  for (var i = 0; i < 40; i++) {
    yield db.models.Admin.create({
      name: '用户' + i,
      password: '123456',
      phone: '18840823910',
      nickname: '用户' + i,
      type: i % 4 + 1
    })
  }
}

function* rankSeed() {
  for (var i = 0; i < 40; i++) {
    yield db.models.Rank.create({
      name: "name" + i,
      min: 10 * i,
      max: (i + 1) * 10
    })
  }
}

function* commentSeed() {
  for (var i = 0; i < 40; i++) {
    yield db.models.Comment.create({
      score: i % 5,
      status: i % 2,
      message: "message" + i,
      UserId: 1,
      GoodId: 1
    })
  }
}

function* userSeed() {
  for (var i = 0; i < 20; i++) {
    yield db.models.User.create({
      password: '123456',
      phone: '12345678901',
      nickname: '用户' + i,
      headimgurl: 'http://img3.shijue.cvidea.cn/tf/150613/2390340/557c39ae3dfae918de000001.JPEG',
      sex: i % 2 + 1,
      unionid: 'unionid',
      openid: 'openid',
      joinTime: Date.now()
    })
  }
}

function* storeSeed() {
  var users = yield db.models.User.findAll()
  var stores = []
  for (var i = 0; i < users.length / 2; i++) {
    var tmp = yield db.models.Store.create({
      username: 'username' + i,
      name: '店铺' + i,
      phone: '12345678901',
      status: i % 2,
      UserId: users[i].id,
      checkTime: (i % 2) == 1 ? Date.now() : null,
    })
    stores.push(tmp)
  }
  var topStore
  for (i = users.length / 2; i < users.length; i++) {
    topStore = stores[(i - users.length / 2) % stores.length]
    yield db.models.Store.create({
      username: 'username' + i,
      name: '店铺' + i,
      phone: '12345678901',
      status: i % 2,
      UserId: users[i].id,
      StoreId: topStore.id
    })
    topStore.inferiorNum++
    yield topStore.save()
  }
}

function* salerGoodsSeed() {
  var goods = yield db.models.Goods.findAll()
  var store = yield db.models.Store.findAll()

  for (var i = 0; i < 40; i++) {
    yield db.models.SalerGoods.create({
      StoreId: store[i % store.length].id,
      GoodId: goods[i % goods.length].id
    });
  }
}

function* goodsSeed() {
  var goodsTypes = yield db.models.GoodsType.findAll({
    where: {
      type: 2
    },
    include: [{
      model: db.models.GoodsType,
      as: 'ParentType'
    }]
  });
  for (var i = 0; i < 40; i++) {
    var type1 = goodsTypes[i % goodsTypes.length]
    var type2 = goodsTypes[(i + 1) % goodsTypes.length]
    var fields = JSON.parse(type1.fields).concat(JSON.parse(type1.ParentType.fields))
      .concat(JSON.parse(type2.fields).concat(JSON.parse(type2.ParentType.fields)))

    var extraFields = fields.map((field) => {
      return fillField(field, i)
    })

    var goods = yield db.models.Goods.create({
      title: '商品' + i,
      mainImg: '/goods.png',
      imgs: '[]',
      price: 20 + i,
      oldPrice: 10 + i,
      capacity: 20 + i,
      content: '内容' + i,
      baseSoldNum: i,
      compoundSoldNum: i,
      timeToDown: null,
      commission1: i * 5 / 10,
      commission2: i * 4 / 10,
      commission3: i * 3 / 10,
      status: 1,
      extraFields: JSON.stringify(extraFields),
      buyLimit: i % 5
    })
    yield db.models.GoodsOfType.create({
      GoodId: goods.id,
      GoodsTypeId: type1.id
    })
    yield db.models.GoodsOfType.create({
      GoodId: goods.id,
      GoodsTypeId: type2.id
    })
    if (i % 2) {
      yield goods.destroy()
    }
  }

  function fillField(field, i) {
    switch (field.type) {
      case '0':
      case '1':
        return util._extend({ "value": i }, field)
      case '2':
        return util._extend({ "value": '2016-01-' + i }, field)
      case '3':
        return util._extend({ "value": i }, field)
      case '4':
        return util._extend({ "value": [i, i + 1, i + 2] }, field)
    }
  }
}

function diffDate() {
  for (var i = 1; i < 1000; i++) {
    for (var j = 1; j < 3000; j++) {

    }
  }
  return Date.now()
}

function* goodsTypeSeed() {
  var ids = []
  var fields = [{
    title: "扩展属性"
  }]
  for (var i = 1; i < 5; i++) {
    var tmp = yield db.models.GoodsType.create({
      title: '一级类型' + i,
      type: 1,
      fields: JSON.stringify([{
        title: '一级扩展属性1-' + i,
        id: diffDate(),
        type: '0',
        options: []
      }, {
        title: '一级扩展属性2-' + i,
        id: diffDate(),
        type: '1',
        options: []
      }, {
        title: '一级扩展属性3-' + i,
        id: diffDate(),
        type: '2',
        options: []
      }, {
        title: '一级扩展属性4-' + i,
        id: diffDate(),
        type: '3',
        options: ['1', '2', '3']
      }, {
        title: '一级扩展属性5-' + i,
        id: diffDate(),
        type: '4',
        options: ['1', '2', '3']
      }])
    })
    ids.push(tmp.id)
  }
  for (var j = 0; j < ids.length; j++) {
    for (var i = 1; i < 5; i++) {
      var tmp = yield db.models.GoodsType.create({
        title: '二级类型' + j + i,
        type: 2,
        GoodsTypeId: ids[j],
        fields: JSON.stringify([{
          title: '二级扩展属性1' + j + i,
          id: diffDate(),
          type: '0',
          options: []
        }, {
          title: '二级扩展属性2' + j + i,
          id: diffDate(),
          type: '1',
          options: []
        }, {
          title: '二级扩展属性3' + j + i,
          id: diffDate(),
          type: '2',
          options: []
        }, {
          title: '二级扩展属性4' + j + i,
          id: diffDate(),
          type: '3',
          options: ['1', '2', '3']
        }, {
          title: '二级扩展属性5' + j + i,
          id: diffDate(),
          type: '4',
          options: ['1', '2', '3']
        }])
      })
    }
  }

}


function* addressSeed() {
  var users = yield db.models.User.findAll({})
  var defaults = {}
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
    })
    defaults[users[i % users.length].id] = true
  }
}

function* identitySeed() {
  var users = yield db.models.User.findAll({})
  var defaults = {}
  for (var i = 0; i < 160; i++) {
    yield db.models.Identity.create({
      name: '备案人' + i,
      phone: "1884082390" + i % 10,
      identityNum: "12345678901234567" + i % 10,
      isDefault: defaults[users[i % users.length].id] ? false : true,
      UserId: users[i % users.length].id
    })
    defaults[users[i % users.length].id] = true
  }
}

function* containerSeed() {
  yield db.models.Container.overduetime(30)
  yield db.models.Container.autoaccepttime(15)
  yield db.models.Container.extendaccepttime(3)
}

function* shoppingCartSeed() {
  var users = yield db.models.User.findAll({})
  var goods = yield db.models.Goods.findAll({})
  var salerGoods = yield db.models.SalerGoods.findAll({})
  for (var i = 0; i < users.length; i++) {
    for (var j = 0; j < goods.length && j < 5; j++) {
      s = yield db.models.ShoppingCart.create({
        num: i + j + 1,
        UserId: users[i % users.length].id,
        GoodId: goods[j % goods.length].id,
        type: 0,
      })
    }
    for (var j = 0; j < salerGoods.length && j < 5; j++) {
      s = yield db.models.ShoppingCart.create({
        num: i + j + 1,
        UserId: users[i % users.length].id,
        SalerGoodId: salerGoods[j % salerGoods.length].id,
        type: 1
      })
    }
  }
}

function* collectionSeed() {
  var users = yield db.models.User.findAll({})
  var goods = yield db.models.Goods.findAll({})
  var salerGoods = yield db.models.SalerGoods.findAll({})
  for (var i = 0; i < users.length; i++) {
    for (var j = 0; j < goods.length && j < 5; j++) {
      s = yield db.models.GoodsCollection.create({
        UserId: users[i % users.length].id,
        GoodId: goods[j % goods.length].id,
        type: 0,
      })
    }
    for (var j = 0; j < salerGoods.length && j < 5; j++) {
      s = yield db.models.GoodsCollection.create({
        UserId: users[i % users.length].id,
        SalerGoodId: salerGoods[j % salerGoods.length].id,
        type: 1
      })
    }
  }
}

function* orderSeed() {

  var users = yield db.models.User.findAll({})
  var goods = yield db.models.Goods.findAll({})
  var stores = yield db.models.Store.findAll({})
  for (var i = 0; i < users.length && i < 10; i++) {
    for (var j = 0; j < 10; j++) {
      //console.log('j:', j);
      var items = []
      var price = 0
      var type = j % 2
      var num = 0
      var store = stores[i % stores.length]
      var salerGoods = yield db.models.SalerGoods.findAll({
        where: {
          StoreId: store.id
        },
        include: [db.models.Goods]
      })
      for (var k = 0; k < (i + j % 10) + 1 && k < 5; k++) {
        //console.log('k:', k);
        var goodsItem = type == 0 ? goods[(i + j + k) % goods.length] : salerGoods[(i + j + k) % salerGoods.length].Good
        price += ((i + j % 10) + 1) * goodsItem.price
        items.push(db.models.OrderItem.build({
          goods: JSON.stringify(goodsItem),
          price: ((i + j % 10) + 1) * goodsItem.price,
          num: (i + j % 10) + 1,
          type,
          SalerGoodId: type == 1 ? goodsItem.id : null,
          GoodId: type == 0 ? goodsItem.id : null
        }))
        num += (i + j % 10) + 1
      }
      var status = (i + j) % 4
      var returnStatus = (i + j) % 2
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
      })
      for (var k = 0; k < items.length; k++) {
        items[k].OrderId = order.id
        yield items[k].save()
      }
    }
  }
}

function* slideshowSeed() {
  for (var i = 0; i < 3; i++) {
    yield db.models.SlideShow.create({
      link: '/user/center',
      address: '/tmp/' + ((i % 3) + 1) + '.jpg'
    })
  }
}

function* init() {
  yield db.sync({
    force: true
  })
  yield userSeed()
  yield adminerSeed()
  yield storeSeed()
  yield goodsTypeSeed()
  yield goodsSeed()

  yield salerGoodsSeed()
  yield shoppingCartSeed()
  //yield msgSeed()
  yield addressSeed()
  yield identitySeed()
  yield containerSeed()
  //yield orderSeed()
  yield commentSeed()
  yield rankSeed()
  yield collectionSeed()
  yield slideshowSeed()
}

co(function*() {
  yield init()
  console.log('finished ...')
}).catch(function() {
  console.log(arguments)
})
