const debug = rootRequire('debug')('SignPackage')
const jsSdk = rootRequire('app/libs/jssdk')

module.exports = async function getSignPackage (ctx, next) {
  const signPackage = await jsSdk.getSignPackage(ctx.query.url)
  debug('get signPackage: ${signPackage}')
  ctx.signPackage = signPackage
  await next()
}