'use strict'

async function create (conn, args = { }) {
  const query = 'CREATE TABLE IF NOT EXISTS transactions( \
    _v VARCHAR(25) NOT NULL, \
    workspace_id VARCHAR(25) NOT NULL, \
    unit MEDIUMINT DEFAULT 0, \
    action VARCHAR(255), \
    related_action VARCHAR(255), \
    PRIMARY KEY (_v, workspace_id, unit) \
  );'

  await conn.query(query)
}

async function createMeta (conn, args = { }) {
  const query = 'CREATE TABLE IF NOT EXISTS transaction_meta( \
    _v VARCHAR(25) NOT NULL, \
    workspace_id VARCHAR(25) NOT NULL, \
    unit MEDIUMINT DEFAULT 0, \
    created VARCHAR(25), \
    membership_type VARCHAR(255), \
    billing_cycle_type VARCHAR(255), \
    start_date VARCHAR(25), \
    expiry_date VARCHAR(25), \
    user_limit MEDIUMINT DEFAULT 0, \
    transaction_amount FLOAT DEFAULT 0, \
    price FLOAT DEFAULT 0, \
    nb_special_license FLOAT DEFAULT 0, \
    refund_amount FLOAT DEFAULT 0, \
    from_billing_cycle VARCHAR(255), \
    to_billing_cycle VARCHAR(255), \
    from_license MEDIUMINT DEFAULT 0, \
    to_license MEDIUMINT DEFAULT 0, \
    diff_license MEDIUMINT DEFAULT 0, \
    PRIMARY KEY (_v, workspace_id, unit) \
  );'

  await conn.query(query)
}

async function load (conn, args = { }) {
  const { tr } = args.data

  let count = 0
  let countMeta = 0

  for (let t of tr) {
    const transactions = {
      workspace_id: t.workspace_id,
      unit: t.unit,
      action: t.action,
      related_action: t.related_action,
      _v: t._v
    }

    const meta = {
      workspace_id: t.workspace_id,
      unit: t.unit,
      created: t.created,
      membership_type: t.membership_type,
      billing_cycle_type: t.billing_cycle_type,
      start_date: t.start_date,
      expiry_date: t.expiry_date,
      user_limit: t.user_limit,
      transaction_amount: t.transaction_amount,
      price: t.price,
      nb_special_license: t.nb_special_license,
      refund_amount: t.refund_amount,
      from_billing_cycle: t.from_billing_cycle,
      to_billing_cycle: t.to_billing_cycle,
      from_license: t.from_license,
      to_license: t.to_license,
      diff_license: t.diff_license,
      _v: t._v
    }

    const queryTransactions = 'INSERT IGNORE INTO transactions SET ?;'
    const queryMeta = 'INSERT IGNORE INTO transaction_meta SET ?;'

    const result = await conn.query(queryTransactions, transactions)
    count += result.affectedRows

    const resultMeta = await conn.query(queryMeta, meta)
    countMeta += resultMeta.affectedRows
  }
  console.log(`${count} transactions added`)
  console.log(`${countMeta} meta transactions added`)
}

module.exports = {
  create,
  createMeta,
  load
}
