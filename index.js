'use strict'

const { mongo, sql } = require('./lib/db')
const { toStrId, validateObjectId, getDate } = require('./lib/helpers')

const Production = require('./production')
const Analytic = require('./analytic')

const run = async () => {
  // Connect to database
  await mongo.connect('dbProd')
  await sql.connect('dbAnal')

  // Set time for batch
  const args = {
    batchDate: getDate()
  }

  // Fetch workspaces
  const workspaces = await mongo.fetch('dbProd', Production.workspaces.get, args)

  // Extract all workspace and memberships Ids
  const ids = workspaces.reduce((acc, x) => {
    const isWsIdValid = validateObjectId(x['workspace_id'])
    const isMbIdValid = validateObjectId(x['membership_id'])

    if (isWsIdValid) {
      const wsId = toStrId(x['workspace_id'])
      acc['wsIds'].push(wsId)
    }
    if (isMbIdValid) {
      const mbId = toStrId(x['membership_id'])
      acc['mbIds'].push(mbId)
    }
    return acc
  }, { wsIds: [], mbIds: [] })

  args['wsIds'] = ids['wsIds']
  args['mbIds'] = ids['mbIds']

  // Fetch memberships
  const memberships = await mongo.fetch('dbProd', Production.memberships.get, args)

  // Fetch AuditLogs
  const audits = await mongo.fetch('dbProd', Production.audits.get, args)

  // Fetch transactions
  const transactions = await mongo.fetch('dbProd', Production.transactions.get, args)

  args['data'] = {
    ws: workspaces,
    mb: memberships,
    aL: audits,
    tr: transactions
  }

  await sql.query('dbAnal', Analytic.workspaces.create, args)
  await sql.query('dbAnal', Analytic.memberships.create, args)
  await sql.query('dbAnal', Analytic.events.create, args)
  await sql.query('dbAnal', Analytic.events.createMeta, args)
  await sql.query('dbAnal', Analytic.transactions.create, args)
  await sql.query('dbAnal', Analytic.transactions.createMeta, args)

  console.log('-----')
  await sql.query('dbAnal', Analytic.workspaces.load, args)
  await sql.query('dbAnal', Analytic.memberships.load, args)
  await sql.query('dbAnal', Analytic.events.load, args)
  await sql.query('dbAnal', Analytic.transactions.load, args)

  mongo.close('dbProd')
  sql.close('dbAnal')
}

run()
