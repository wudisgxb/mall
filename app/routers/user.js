/**
 * Created by Thinkpad on 2017/3/19.
 */
const router = new (rootRequire('koa-router'))()
const User = rootRequire('app/controller/User')


router.get('/api/v1/user', User.index)

router.get('/', async (ctx, next) => {
  ctx.body = ctx.host
})



module.exports = router