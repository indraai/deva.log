// Log Deva (c)2023 Quinn Michaels
// Log Deva handles logging events
const Deva = require('@indra.ai/deva');
const { MongoClient } = require("mongodb");
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

const {agent,vars} = require('./data.json').DATA;
const LOG = new Deva({
  info,
  agent,
  vars,
  utils: {
    translate(input) {return input.trim();},
    parse(input) {return input.trim();},
    process(input) {return input.trim();}
  },
  listeners: {
    'devacore:question'(packet) {
      this.func.log_write('question', packet);
    },
    'devacore:answer'(packet) {
      this.func.log_write('answer', packet);
    },
    'devacore:ask'(packet) {
      this.func.log_write('ask', packet);
    },
    'devacore:error'(packet) {
      this.func.log_write('error', packet);
    },
  },
  modules: {
    client: false,
  },
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
  onInit(data) {
    const {uri,database} = this.services().personal.mongo;
    this.modules.client = new MongoClient(uri);
    this.vars.database = database;
    return this.start(data);
  }
});
module.exports = LOG
