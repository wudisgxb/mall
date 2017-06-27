const debug = rootRequire('debug')('ShopModel')

const shops = [{
  id: 0,
  logo: 'logo.jpg',
  name: '雪花冰(南京)缤纷汇店',
  state: '营业中',
  distance: '≤ 1.2km'
}]
let id = 0

class Shop {
  // id, name, logo, location, openTime, closeTime
  constructor(opt) {
    Object.assign(this, opt, { id })
    id += 1
  }

  static findAll() {
    debug(`find all shops: ${shops}`)
    return shops
  }

  static findOne(id) {
    const shop = shops.find(e => e.id == id)

    if (shop) {
      debug(`find one shop: ${shop}`)
      return Promise.resolve(shop)
    } else {
      debug(`not found shop; id: ${id}`)
      return Promise.reject(`not found shop; id: ${id}`)
    }
  }

  static save(shop) {
    debug(`save a shop: ${shop}`)
    shops.push(shop)
    console.log(shops)
    return Promise.resolve('save success!')
  }

  static del(shop) {
    const index = shops.findIndex(s => s.id === shop.id)
    if (index >= 0) {
      debug('del a shop success, shop: ${shops[index]}')
      shops.splice(index, 1)
    }
  }
}

module.exports = Shop
