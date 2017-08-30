'use strict'

const { toObjectId, toObjectDate, toMap } = require('../lib/helpers')

async function get (db, args = { }) {
  const audits = await fetch(db, args)
  const _audits = format(audits, args)
  return _audits
}

// Fetching data

async function fetchEvents (db, args = { }) {
  const collection = db.collection('audits')

  const { from, to } = args.batchDate

  const query = [
    {
      $match: {
        space_id: {
          $in: args['wsIds']
        },
        created: {
          $gte: new Date('2017-05-01T00:00:00.000Z'), // new Date(from)
          $lt: new Date('2017-05-02T00:00:00.000Z') // new Date(to)
        }
      }
    },
    {
      $group: {
        _id: { space_id: '$space_id', event: '$event' },
        event_count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.space_id',
        events: {
          $push: {
            event: '$_id.event',
            count: '$event_count'
          }
        },
        total: { $sum: '$event_count' }
      }
    },
    {
      $sort: { total: -1 }
    }
  ]

  const events = await collection.aggregate(query).toArray()
  console.log(`${events.length} events have been fetched`)

  return events
}

async function fetchUsers (db, args = { }) {
  const collection = db.collection('audits')

  const { from, to } = args.batchDate

  const query = [
    {
      $match: {
        space_id: {
          $in: args['wsIds']
        },
        created: {
          $gte: new Date('2017-05-01T00:00:00.000Z'), // new Date(from)
          $lt: new Date('2017-05-02T00:00:00.000Z') // new Date(to)
        }
      }
    },
    {
      $group: {
        _id: { space_id: '$space_id', user: '$owner_id' },
        user_count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.space_id',
        users: {
          $push: {
            user: '$_id.user',
            count: '$user_count'
          }
        },
        total: { $sum: '$user_count' }
      }
    },
    { $sort: { total: -1 } }
  ]

  const users = await collection.aggregate(query).toArray()
  console.log(`${users.length} users have been fetched`)

  return users
}

async function fetch (db, args = { }) {
  const events = await fetchEvents(db, args)
  const users = await fetchUsers(db, args)
  const userMap = toMap(users, '_id')

  const audits = events.reduce((acc, e, i) => {
    const eWsId = e['_id']
    const u = userMap[eWsId]

    if (u) {
      acc[i] = {
        workspace_id: eWsId,
        total: {
          events: e['total'],
          users: u['total']
        },
        events: e['events'],
        users: u['users']
      }
    }
    return acc
  }, [])

  console.log(`-> There are ${audits.length} audit logs`)
  return audits
}

// Formating data

function format (audits, args = { }) {
  return audits.map(doc => {
    const audit = {
      workspace_id: toObjectId(doc['workspace_id'])
    }

    const eventRatios = doc['users'].reduce((acc, x, i) => {
      acc.nb_users += 1
      acc.event_ratios += x['count'] + ':'
      return acc
    }, { nb_users: 0, event_ratios: '' })

    const events = doc['events'].reduce((acc, x) => {
      acc[x['event']] = x['count']
      return acc
    }, {})

    audit['totalEvents'] = doc.total.events === doc.total.users ? doc.total.events : 'error'
    audit['totalUsers'] = eventRatios.nb_users
    audit['eventRatios'] = eventRatios.event_ratios.slice(0, -1)
    audit['events'] = events
    audit['_v'] = toObjectDate(args.batchDate.current)

    return audit
  })
}

module.exports = {
  get
}
