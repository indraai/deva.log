// Log Deva (c)2023 Quinn Michaels
// Log Deva handles logging events
const Deva = require('@indra.ai/deva');
const { MongoClient } = require("mongodb");

const fs = require('fs');
const path = require('path');
const package = require('./package.json');
const info = {
  id: package.id,
  name: package.name,
  version: package.version,
  describe: package.description,
  dir: __dirname,
  url: package.homepage,
  git: package.repository.url,
  bugs: package.bugs.url,
  license: package.license,
  author: package.author,
  copyright: package.copyright,
};

const data_path = path.join(__dirname, 'data.json');
const {agent,vars} = require(data_path).DATA;
agent.dir = __dirname;

const LOG = new Deva({
  info,
  agent,
  vars,
  utils: {
    translate(input) {return input.trim();},
    parse(input) {return input.trim();},
    proecess(input) {return input.trim();}
  },
  listeners: {},
  modules: {
    client: false,
  },
  deva: {},
  func: {
    /**************
    func: log_write
    params: type, packet
    describe: this is the log file writer function that handles writing
    the interactions to json logfile.
    ***************/
    async log_write(type, packet) {
      const created = Date.now();
      const theDate = new Date(created);

      let result = false;

      try {
        const database = this.modules.client.db(this.vars.database);
        const collection = database.collection(type);
        result = await collection.insertOne(packet);
      } catch (e) {
        console.dir(e);
      } finally {
        return result;
      }
    },

  },
  methods: {},
  onDone(data) {
    const {uri,database} = this.services().personal.mongo;
    this.modules.client = new MongoClient(uri);
    this.vars.database = database;

    this.listen('devacore:question', packet => {
      return this.func.log_write('question', packet);
    });
    this.listen('devacore:answer', packet => {
      return this.func.log_write('answer', packet);
    });
    this.listen('devacore:ask', packet => {
      return this.func.log_write('ask', packet);
    });
    this.listen('devacore:error', packet => {
      return this.func.log_write('error', packet);
    });

    return Promise.resolve(data);
  }
});
module.exports = LOG
