'use strict'

module.exports = {
  workspaces: {
    create: require('./workspaces').create,
    load: require('./workspaces').load
  },
  memberships: {
    create: require('./memberships').create,
    load: require('./memberships').load
  },
  events: {
    create: require('./audits').create,
    createMeta: require('./audits').createMeta,
    load: require('./audits').load
  },
  transactions: {
    create: require('./transactions').create,
    createMeta: require('./transactions').createMeta,
    load: require('./transactions').load
  }
}
