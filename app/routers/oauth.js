/**
 * Created by Thinkpad on 2017/3/19.
 */
const router = new (rootRequire('koa-router'))()
const Oauth = rootRequire('app/controller/Oauth')

router.get('/api/v1/oauth', Oauth.redirect)
router.get('/api/v1/oauth/getUser', Oauth.getUser)

module.exports = router