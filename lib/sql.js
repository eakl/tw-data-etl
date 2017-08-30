'use strict'

const Mysql = require('promise-mysql')
const { config, getDbOpts } = require('../config')

async function query (dbName, func, ...args) {
  if (config[dbName].db) {
    return func(config[dbName].db, ...args)
  } else {
    return connect(config[dbName].db).then(() => func(config[dbName].db, ...args))
  }
}

async function connect (dbName) {
  if (config[dbName].db) {
    return config[dbName].db
  } else {
    try {
      const url = `mysql://${config[dbName].user}:${config[dbName].password}@${config[dbName].host}:${config[dbName].port}/${config[dbName].name}${getDbOpts(dbName)}`
      console.log(`Connecting to ${url}`)
      config[dbName].db = await Mysql.createConnection(url)
      console.log(`Connected to MySQL: ${config[dbName].db.connection.config.database}`)
      return config[dbName].db
    } catch (err) {
      throw new Error(err)
    }
  }
}

function close (dbName) {
  if (config[dbName].db) {
    console.log(`Closing ${config[dbName].name} connection.`)
    config[dbName].db.destroy()
  }
}

module.exports = {
  query,
  connect,
  close
}
