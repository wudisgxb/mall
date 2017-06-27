class ApiError extends Error {
  constructor(res, result = []) {
    super(res.resMsg)
    Object.assign(this, res, { result })
  }
}

module.exports = ApiError
