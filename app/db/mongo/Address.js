const mongoose = rootRequire('mongoose')
const Schema = mongoose.Schema

const AddressSchema = new Schema({
  name: String,
  gender: String,
  tel: String,
  address: String,
  is_def: {
    type: Boolean,
    default: false,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'user',
  },
  create_at: {
    type: Date,
    default: Date.now,
  },
  update_at: Date,
})


AddressSchema.statics.setDefault = async function (addressId, userId) {
  const oldDefault = await Address.findOneAndUpdateAsync({
      is_def: true,
      user: userId
    }, {
      $set: {
        is_def: false
      }
    })

    const newDefalut = await Address.findOneAndUpdateAsync({
      _id: addressId
    }, {
      $set: {
        is_def: true
      }
    })

    return newDefalut
}

const Address = mongoose.model('Address', AddressSchema)

module.exports = Address
