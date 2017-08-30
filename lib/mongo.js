'use strict'

const MongoClient = require('mongodb').MongoClient
const { config } = require('../config')

async function fetch (dbName, func, ...args) {
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
      const url = `mongodb://${config[dbName].host}:${config[dbName].port}/${config[dbName].name}`
      console.log(`Connecting to ${url}`)
      config[dbName].db = await MongoClient.connect(url, config[dbName].opts)
      console.log(`Connected to MongoDB: ${config[dbName].db.s.databaseName}`)
      return config[dbName].db
    } catch (err) {
      throw new Error(err)
    }
  }
}

function close (dbName) {
  if (config[dbName].db) {
    console.log(`Closing ${config[dbName].name} connection.`)
    config[dbName].db.close()
  }
}

module.exports = {
  fetch,
  connect,
  close
}
