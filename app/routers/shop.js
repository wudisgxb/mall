/**
 * Created by Thinkpad on 2017/3/20.
 */
const router = new (rootRequire('koa-router'))()
const Shop = rootRequire('app/controller/Shop')
const SignPackage = rootRequire('app/controller/SignPackage')


router.get('/api/v1/shop', SignPackage, Shop.list)

router.post('/api/v1/shop', Shop.save)

router.get('/api/v1/shop/:id', Shop.findOne)

router.post('/api/v1/shop/logo', async (ctx, next) => {
  const path = ctx.request.body.files.file.path
  ctx.body = path.split(/\\/).slice(-1)[0]
})

module.exports = router