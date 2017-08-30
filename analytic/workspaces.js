'use strict'

async function create (conn, args = { }) {
  const query = 'CREATE TABLE IF NOT EXISTS workspaces( \
    _v VARCHAR(25) NOT NULL, \
    workspace_id VARCHAR(25) NOT NULL, \
    workspace_created VARCHAR(25) NOT NULL, \
    workspace_owner_id VARCHAR(25) NOT NULL, \
    membership_id VARCHAR(25), \
    nb_total_members MEDIUMINT DEFAULT 0, \
    nb_admin_members MEDIUMINT DEFAULT 0, \
    nb_regular_members MEDIUMINT DEFAULT 0, \
    nb_pending_members MEDIUMINT DEFAULT 0, \
    nb_removed_members MEDIUMINT DEFAULT 0, \
    nb_teams MEDIUMINT DEFAULT 0, \
    nb_project_groups MEDIUMINT DEFAULT 0, \
    nb_projects MEDIUMINT DEFAULT 0, \
    nb_tasks MEDIUMINT DEFAULT 0, \
    nb_channels MEDIUMINT DEFAULT 0, \
    nb_comments MEDIUMINT DEFAULT 0, \
    nb_attachments MEDIUMINT DEFAULT 0, \
    PRIMARY KEY (_v, workspace_id) \
  );'

  await conn.query(query)
}

async function load (conn, args = { }) {
  const { ws } = args.data

  const data = ws.reduce((acc, x) => {
    delete x['workspace_member_ids']
    delete x['workspace_admin_ids']
    delete x['workspace_pending_members']
    delete x['workspace_removed_members']

    const row = Object.values(x)
    acc.push(row)
    return acc
  }, [])

  const query = 'INSERT IGNORE INTO workspaces( \
    workspace_id, \
    workspace_created, \
    workspace_owner_id, \
    membership_id, \
    nb_total_members, \
    nb_admin_members, \
    nb_regular_members, \
    nb_pending_members, \
    nb_removed_members, \
    nb_teams, \
    nb_project_groups, \
    nb_projects, \
    nb_tasks, \
    nb_channels, \
    nb_comments, \
    nb_attachments, \
    _v \
  ) \
  VALUES ?'

  const result = await conn.query(query, [data])
  console.log(`${result.affectedRows} workspaces added`)
}

module.exports = {
  create,
  load
}
