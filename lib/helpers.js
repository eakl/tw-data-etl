'use strict'

const ObjectID = require('mongodb').ObjectID
const Moment = require('moment')

/*************
 * ID helpers
 *************/

function toMap (col, id) {
  return col.reduce((acc, x) => {
    const _id = x[id]
    acc[_id] = x
    return acc
  }, {})
}

const toObjectId = strId => {
  const valid = ObjectID.isValid(strId)
  if (!valid) {
    return null
  } else {
    return new ObjectID(strId)
  }
}

const toStrId = objId => objId.toHexString()
const validateObjectId = objId => ObjectID.isValid(objId)

/***************
 * Date helpers
 ***************/

const toObjectDate = strDate => new Date(strDate)
const toStrDate = objDate => objDate.toISOString()
const toMoment = objDate => Moment.utc(objDate)

const sortDateASC = (a, b) => a.created - b.created
const sortDateDESC = (a, b) => b.created - a.created

function getDate () {
  const currentDate = Moment().utc()
  const from = Moment(currentDate).utc().subtract(1, 'days').startOf('day')
  const to = Moment(currentDate).utc().subtract(1, 'days').endOf('day')

  return {
    current: currentDate.format('YYYY-MM-DD'),
    from: new Date(from),
    to: new Date(to)
  }
}

/**********************
 * Object Keys helpers
 **********************/

function getKey (doc, keys, def, count = 0) {
  const key = keys[count]

  if (count < keys.length) {
    if (!(doc && doc[key])) {
      return def
    } else {
      return getKey(doc[key], keys, def, ++count)
    }
  } else {
    return doc
  }
}

function getProfileMembers (doc, keys, def) {
  const key = keys[0]

  if (!(doc && doc[key])) {
    return def
  } else {
    return doc[key].reduce((acc, x, i) => {
      acc[i] = {
        _id: getKey(x, ['_id']),
        pending: x['awaiting_confirmation'] ? x['awaiting_confirmation'] : false,
        removed: x['is_removed'] ? x['is_removed'] : false
      }
      return acc
    }, [])
  }
}

module.exports = {
  toMap,
  toObjectId,
  toStrId,
  validateObjectId,
  toObjectDate,
  toStrDate,
  toMoment,
  sortDateASC,
  sortDateDESC,
  getDate,
  getKey,
  getProfileMembers
}
