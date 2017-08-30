'use strict'

module.exports = {
  workspaces: {
    get: require('./workspaces').get
  },
  memberships: {
    get: require('./memberships').get
  },
  audits: {
    get: require('./audits').get
  },
  transactions: {
    get: require('./transactions').get
  }
}
