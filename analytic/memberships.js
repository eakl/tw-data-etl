'use strict'

async function create (conn, args = { }) {
  const query = 'CREATE TABLE IF NOT EXISTS memberships( \
    _v VARCHAR(25) NOT NULL, \
    membership_id VARCHAR(25) NOT NULL, \
    membership_created VARCHAR(25) NOT NULL, \
    membership_type VARCHAR(25), \
    billing_cycle_type VARCHAR(255), \
    bucket VARCHAR(255), \
    extension_days MEDIUMINT DEFAULT 0, \
    first_subscription_date VARCHAR(255), \
    current_subscription_start_date VARCHAR(255), \
    current_subscription_expiry_date VARCHAR(255), \
    days_from_first_subscription FLOAT DEFAULT 0, \
    days_to_subscription_expiry_date FLOAT DEFAULT 0, \
    days_from_subscription_expiry_date FLOAT DEFAULT 0, \
    user_limit MEDIUMINT DEFAULT 0, \
    free_license MEDIUMINT DEFAULT 0, \
    price FLOAT DEFAULT 0, \
    price_per_license FLOAT DEFAULT 0, \
    upgrade_this_month TINYINT(1) DEFAULT 0, \
    refunded_this_month TINYINT(1) DEFAULT 0, \
    PRIMARY KEY (_v, membership_id) \
  );'

  await conn.query(query)
}

async function load (conn, args = { }) {
  const { mb } = args.data

  const data = mb.reduce((acc, x) => {
    const row = Object.values(x)
    acc.push(row)
    return acc
  }, [])

  const query = 'INSERT IGNORE INTO memberships( \
    membership_id, \
    membership_created, \
    membership_type, \
    billing_cycle_type, \
    bucket, \
    extension_days, \
    first_subscription_date, \
    current_subscription_start_date, \
    current_subscription_expiry_date, \
    days_from_first_subscription, \
    days_to_subscription_expiry_date, \
    days_from_subscription_expiry_date, \
    user_limit, \
    free_license, \
    price, \
    price_per_license, \
    upgrade_this_month, \
    refunded_this_month, \
    _v \
  ) \
  VALUES ?;'

  const result = await conn.query(query, [data])
  console.log(`${result.affectedRows} memberships added`)
}

module.exports = {
  create,
  load
}
