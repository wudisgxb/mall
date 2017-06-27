/**
 * Created by Thinkpad on 2017/3/20.
 */
const router = new (rootRequire('koa-router'))()
const WeChat = rootRequire('app/controller/WeChat')

router
.get('/api/v1/wechat', WeChat)
.post('/api/v1/wechat', WeChat)

module.exports = router