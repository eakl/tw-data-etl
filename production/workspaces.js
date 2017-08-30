'use strict'

const {
  toObjectId,
  toObjectDate,
  getKey,
  getProfileMembers } = require('../lib/helpers')

async function get (db, args = { }) {
  const workspaces = await fetch(db, args)
  const _workspaces = format(workspaces, args)
  const __workspaces = getStats(_workspaces, args)
  const ___workspaces = filter(__workspaces, args)
  return ___workspaces
}

// Fetching data

async function fetch (db, args = { }) {
  const collection = db.collection('workspaces')

  const MAX_DOCS = 10000
  let SKIP = 0

  const query = { }
  const workspaces = [ ]

  while (true) {
    const docs = await collection.find(query).limit(MAX_DOCS).skip(SKIP).toArray()

    if (!docs.length) {
      console.log('Finished!')
      break
    } else {
      console.log(`Next ${docs.length} docs fetched`)
    }
    SKIP += docs.length
    workspaces.push(...docs)
  }

  console.log(`${workspaces.length} workspaces have been fetched`)

  return workspaces
}

// Formatting data

function format (col, args = { }) {
  return col.reduce((acc, doc, i) => {
    acc[i] = {
      workspace_id: getKey(doc, ['_id'], null), // ObjectID
      workspace_created: getKey(doc, ['created'], null), // ISODate
      workspace_owner_id: getKey(doc, ['owner_id'], null), // String
      workspace_member_ids: getKey(doc, ['members'], []), // Array[String]
      workspace_admin_ids: getKey(doc, ['admins'], []), // Array[String]
      workspace_profile_members: getProfileMembers(doc, ['member_profiles'], []), // Array[Object]
      workspace_pending_members: [],
      workspace_removed_members: [],
      membership_id: toObjectId(getKey(doc, ['membership_id'], null)), // String
      stats: {
        // updated: getKey(doc, ['stats_updated'], null),
        channel_id_counter: getKey(doc, ['channel_id_counter'], 0), // Number
        task_id_counter: getKey(doc, ['task_id_counter'], 0), // Number
        team_id_counter: getKey(doc, ['team_id_counter'], 0), // Number
        project_group_id_counter: getKey(doc, ['project_group_id_counter'], 0), // Number
        project_id_counter: getKey(doc, ['project_id_counter'], 0), // Number
        id_counter: getKey(doc, ['id_counter'], 0), // Number
        // Other stats
        numAttachments: getKey(doc, ['stats', 'numAttachments'], 0), // Number
        numComments: getKey(doc, ['stats', 'numComments'], 0), // Number
        numTasks: getKey(doc, ['stats', 'numTasks'], 0), // Number
        numProjects: getKey(doc, ['stats', 'numProjects'], 0) // Number
      }
    }
    return acc
  }, [])
}

// Guetting some stats

function getStats (col, args = { }) {
  return col.reduce((acc, doc, i) => {
    // Get Pending and Removed members
    const specialMembers = doc['workspace_profile_members'].reduce((acc, pm, i) => {
      if (pm['pending'] && !pm['removed']) {
        acc.pending[i] = pm['_id']
      }
      if (pm['removed']) {
        acc.removed[i] = pm['_id']
      }
      return acc
    }, { pending: [], removed: [] })

    const pending = specialMembers.pending.filter(p => p !== null)
    const removed = specialMembers.removed.filter(r => r !== null)

    // Get Admins
    doc['workspace_admin_ids'] = [...new Set(doc['workspace_admin_ids'])].filter(a => {
      return a !== '55e59ec2b68cdc1411955142' && !pending.includes(a) && !removed.includes(a)
    })
    const nbAdmins = doc['workspace_admin_ids'].length

    // Get Regular members
    doc['workspace_member_ids'] = [...new Set(doc['workspace_member_ids'])].filter(m => {
      return m !== '55e59ec2b68cdc1411955142' && !pending.includes(m) && !removed.includes(m)
    })
    const nbMembers = doc['workspace_member_ids'].length

    const members = doc['workspace_member_ids'].filter(m => {
      return !doc['workspace_admin_ids'].includes(m) &&
      !pending.includes(m) &&
      !removed.includes(m)
    })

    // Stats
    const stats = {
      nb_total_members: nbMembers, // nbMembers,
      nb_admin_members: nbAdmins, // nbAdmins,
      nb_regular_members: members.length, // nbRegularMembers,
      nb_pending_members: pending.length, // nbPendingMembers,
      nb_removed_members: removed.length, // nbRemovedMembers,
      nb_teams: doc['stats']['team_id_counter'],
      nb_project_groups: doc['stats']['project_group_id_counter'],
      nb_projects: doc['stats']['project_id_counter'],
      nb_tasks: doc['stats']['task_id_counter'],
      nb_channels: doc['stats']['channel_id_counter'],
      nb_comments: doc['stats']['numComments'],
      nb_attachments: doc['stats']['numAttachments']
    }

    const newObject = Object.assign({}, doc, stats)
    delete newObject['workspace_profile_members']
    delete newObject['stats']
    newObject['_v'] = toObjectDate(args.batchDate.current)

    acc[i] = newObject
    return acc
  }, [])
}

function filter (col, args = { }) {
  return col.filter(x => {
    return x['workspace_created'] !== null
  })
}

module.exports = {
  get
}
