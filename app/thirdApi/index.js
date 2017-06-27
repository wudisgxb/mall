const httpAgent = rootRequire('app/libs/httpAgent')
const key = rootRequire('config/config').thirdApiKeys.turingRobot
const debug = rootRequire('debug')('thirdApi')


module.exports = {
  fetchTuringResp
}

function fetchTuringResp(info) {
  if (typeof info !== 'string') {
    throw new Error('fetchTuringResp; info must be string!')
  }
  info = encodeURIComponent(info)
  let options = {
    method: 'GET',
    url: `http://www.tuling123.com/openapi/api?key=${key}&info=${info}`
  };

  return httpAgent(options).then(resp => resp.data)
}
