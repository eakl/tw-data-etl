'use strict'

async function create (conn, args = { }) {
  const query = 'CREATE TABLE IF NOT EXISTS events( \
    _v VARCHAR(25) NOT NULL, \
    workspace_id VARCHAR(25) NOT NULL, \
    event_name VARCHAR(255), \
    event_number MEDIUMINT DEFAULT 0, \
    PRIMARY KEY (_v, workspace_id, event_name) \
  );'

  await conn.query(query)
}

async function createMeta (conn, args = { }) {
  const query = 'CREATE TABLE IF NOT EXISTS event_meta( \
    _v VARCHAR(255) NOT NULL, \
    workspace_id VARCHAR(255) NOT NULL, \
    total_events MEDIUMINT DEFAULT 0, \
    total_users MEDIUMINT DEFAULT 0, \
    event_ratios VARCHAR(1000), \
    PRIMARY KEY (_v, workspace_id) \
  );'

  await conn.query(query)
}

async function load (conn, args = { }) {
  const { aL } = args.data

  let count = 0
  let countMeta = 0

  for (let a of aL) {
    for (let [eK, eV] of Object.entries(a.events)) {
      const events = {
        workspace_id: a.workspace_id,
        event_name: eK,
        event_number: eV,
        _v: a._v
      }

      const queryEvents = 'INSERT IGNORE INTO events SET ?;'

      const result = await conn.query(queryEvents, events)
      count += result.affectedRows
    }

    const meta = {
      workspace_id: a.workspace_id,
      total_events: a.totalEvents,
      total_users: a.totalUsers,
      event_ratios: a.eventRatios,
      _v: a._v
    }

    const queryMeta = 'INSERT IGNORE INTO event_meta SET ?;'

    const resultMeta = await conn.query(queryMeta, meta)
    countMeta += resultMeta.affectedRows
  }

  console.log(`${count} events added`)
  console.log(`${countMeta} meta events added`)
}

module.exports = {
  create,
  createMeta,
  load
}
