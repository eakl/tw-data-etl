'use strict'

const { toObjectId, toObjectDate } = require('../lib/helpers')

async function get (db, args = { }) {
  const transactions = await fetch(db, args)
  const _transactions = format(transactions, args)
  return _transactions
}

// Fetching data

async function fetch (db, args = { }) {
  const collection = db.collection('transaction_logs')

  const { from, to } = args.batchDate

  const query = [
    {
      $match: {
        workspace_id: {
          $in: args['wsIds']
        },
        created: {
          $gte: new Date('2017-04-01T00:00:00.000Z'), // new Date(from)
          $lt: new Date('2017-05-02T00:00:00.000Z') // new Date(to)
        }
      }
    },
    {
      $group: {
        _id: '$workspace_id',
        transactions: {
          $push: {
            created: '$created',
            action: '$action',
            related_action: '$related_action',
            success: '$success',
            transaction_amount: '$transaction_amount',
            subscription_id: '$subscription_id',
            membership_type: '$membership.membership_type',
            billing_cycle_type: '$membership.billing_cycle_type',
            start_date: '$membership.start_date',
            expiry_date: '$membership.expiry_date',
            price: '$membership.price',
            user_limit: '$membership.user_limit',
            from_billing_cycle: '$membership_log.from_billing_cycle',
            to_billing_cycle: '$membership_log.to_billing_cycle',
            from_license: '$membership_log.from_license',
            to_license: '$membership_log.to_license',
            diff_license: '$membership_log.diff_license',
            refund_amount: '$refund_amount',
            nb_special_license: '$membership_log.special_license'
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]

  const transactions = await collection.aggregate(query).toArray()
  console.log(`${transactions.length} transactions have been fetched`)

  return transactions
}

function format (transactions, args = { }) {
  const actions = {
    'createCustomer': 'new_customer', // create customer on braintree
    'createSubscription': 'new_plan', // convertion from trial to premium

    'subscription_charged_successfully': 'charged_success', // recuring payment charged successfully
    'subscription_charged_unsuccessfully': 'charged_fail', // recuring payment charged unsuccessfully

    'makeSale': 'update_plan', // additional charge for the new bucket for the remaining days (when the customer updade)
    'updateSubscription': 'other', // not important - only one action in database
    'updateIncreaseSubscription': 'upgrade_plan', // increase number of users (increase bucket)
    'updateDecreaseSubscription': 'downgrade_plan', // decrease number of users (decrease bucket)

    'retryChargeSubscription': 'halt_try_renew', // when button is pressed (no matter if it fails or pass)
    'renewHaltSubscription': 'halt_try_renew_passed', // when status is halted - charging pass within 10 days (when hit the button)
    'renewHaltCancelSubscription': 'recreate_plan_id', // when the old subscription id is canceled in the membership table
    'reCreateSubscription': 'recreate_plan', // when status is canceled - customer converts again

    'refund': 'refund', // refund
    'specialRevenue': 'other', // not important

    'cancelSubscription': 'cancel_plan', // stop paying
    'subscription_canceled': 'plan_canceled' // plan is canceled
  }

  const exclude = [
    null,
    'check',
    'errorRevenue',
    'notiWebhookParse',
    'void',
    'webhookKindNotFound'
  ]

  return transactions.reduce((acc, tr) => {
    for (let [i, t] of tr.transactions.entries()) {
      if (t.success && !exclude.includes(t.action)) {
        const action = actions[t.action]
        const relatedAction = actions[t.related_action]
        t.action = action || 'other'
        t.related_action = relatedAction || null
        const transac = Object.assign(
         { },
         { workspace_id: toObjectId(tr._id) },
         { unit: i + 1 },
         t,
         { _v: toObjectDate(args.batchDate.current) }
       )
        acc.push(transac)
      }
    }

    return acc
  }, [])
}

module.exports = {
  get
}
