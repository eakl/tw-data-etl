'use strict'

const Moment = require('moment')

const {
  toObjectId,
  toObjectDate,
  toMoment,
  getKey } = require('../lib/helpers')

async function get (db, args = { }) {
  const memberships = await fetch(db, args)
  const _memberships = format(memberships, args)
  const __memberships = getStats(_memberships, args)
  return __memberships
}

// Fetching data

async function fetch (db, args = { }) {
  const collection = db.collection('memberships')

  const query = {
    _id: {
      $in: args['mbIds'].map(x => toObjectId(x))
    }
  }

  const memberships = await collection.find(query).toArray()
  console.log(`${memberships.length} memberships have been fetched`)

  return memberships
}

// Formating data

function format (col, args = { }) {
  return col.reduce((acc, doc, i) => {
    acc[i] = {
      membership_id: getKey(doc, ['_id'], null),
      membership_created: getKey(doc, ['created'], null),
      first_subscription_date: getKey(doc, ['start_subscription_date'], null),
      current_subscription_start_date: getKey(doc, ['start_date'], null),
      current_subscription_expiry_date: getKey(doc, ['expiry_date'], null),
      extension_days: getKey(doc, ['extension_days'], 0),
      membership_type: getKey(doc, ['membership_type'], null),
      billing_cycle_type: getKey(doc, ['billing_cycle_type'], null),
      bucket: getKey(doc, ['plan_option', 'pricing_plan_id'], null),
      user_limit: getKey(doc, ['user_limit'], 0),
      free_license: getKey(doc, ['free_license'], 0),
      price: getKey(doc, ['price'], 0),
      current_cycle_charges: {
        normal: getKey(doc, ['cycle_charges', 'normal'], 0),
        upgraded: getKey(doc, ['cycle_charges', 'upgraded'], 0),
        refunded: getKey(doc, ['cycle_charges', 'refunded'], 0)
      }
    }
    return acc
  }, [])
}

// Getting some stats

function getStats (col, args = null) {
  return col.reduce((acc, doc, i) => {
    const currentDate = Moment.utc()
    const firstSubscriptionDate = toMoment(doc['first_subscription_date'])
    const currentExpiryDate = toMoment(doc['current_subscription_expiry_date'])

    const daysFromFirstSubscription = Moment(firstSubscriptionDate).isValid() ? Math.floor(Moment.duration(currentDate.diff(firstSubscriptionDate)).asDays()) : null

    let daysToExpiryDate
    if (Moment(currentExpiryDate).isValid() && Math.floor(Moment.duration(currentExpiryDate.diff(currentDate)).asDays()) > 0) {
      daysToExpiryDate = Math.floor(Moment.duration(currentExpiryDate.diff(currentDate)).asDays())
    } else {
      daysToExpiryDate = null
    }

    let daysFromExpiryDate
    if (Moment(currentExpiryDate).isValid() && Math.floor(Moment.duration(currentDate.diff(currentExpiryDate)).asDays()) > 0) {
      daysFromExpiryDate = Math.floor(Moment.duration(currentDate.diff(currentExpiryDate)).asDays())
    } else {
      daysFromExpiryDate = null
    }

    const isExtensionDays = doc['extension_days'] !== 0
    const pricePerLicense = doc['user_limit'] === 0 ? 0 : doc['price'] / doc['user_limit']

    const upgradedThisMonth = doc['current_cycle_charges']['upgraded'] !== 0
    const refundedThisMonth = doc['current_cycle_charges']['refunded'] !== 0

    let bucket
    if (doc['bucket'] && typeof doc['bucket'] === 'string') {
      const re = /with.*|bucket.*/g
      const match = doc['bucket'].match(re)
      bucket = match ? match[0] : null
    }

    acc[i] = {
      membership_id: doc['membership_id'],
      membership_created: doc['membership_created'],
      membership_type: doc['membership_type'],
      billing_cycle_type: doc['billing_cycle_type'],
      bucket: bucket,
      extension_days: isExtensionDays,

      first_subscription_date: doc['first_subscription_date'],
      current_subscription_start_date: doc['current_subscription_start_date'],
      current_subscription_expiry_date: doc['current_subscription_expiry_date'],
      days_from_first_subscription: daysFromFirstSubscription,
      days_to_subscription_expiry_date: daysToExpiryDate,
      days_from_subscription_expiry_date: daysFromExpiryDate,

      user_limit: doc['user_limit'],
      free_license: doc['free_license'],
      price: doc['price'],
      price_per_license: pricePerLicense,
      upgrade_this_month: upgradedThisMonth,
      refunded_this_month: refundedThisMonth,
      _v: toObjectDate(args.batchDate.current)
    }
    return acc
  }, [])
}

module.exports = {
  get
}
