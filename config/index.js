'use strict'

const config = {
  dbProd: {
    opts: { native_parser: true, poolSize: 5 },
    host: 'localhost',
    port: '27017',
    name: 'taskworld_enterprise_us_uglify',
    db: null
  },
  dbAnal: {
    opts: { timezone: 'Z' },
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: '',
    name: 'tw_analytics',
    db: null
  }
}

function getDbOpts (dbName) {
  const oKeys = Object.keys(config[dbName].opts)
  const options = oKeys.map(o => {
    return o + '=' + config[dbName].opts[o]
  })
  return options.length !== 0 ? '?' + options.join('&') : ''
}

config.dbProd.url = `mongodb://${config.dbProd.host}:${config.dbProd.port}/${config.dbProd.name}`
config.dbAnal.url = `mysql://${config.dbAnal.user}:${config.dbAnal.password}@${config.dbAnal.host}:${config.dbAnal.port}/${config.dbAnal.name}${getDbOpts('dbAnal')}`

module.exports = {
  config,
  getDbOpts
}
