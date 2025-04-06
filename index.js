// Log Deva (c)2025 Quinn Michaels
// Log Deva handles logging events in Deva.space, Deva.cloud, and Deva.world
import Deva from '@indra.ai/deva';
import {MongoClient} from 'mongodb';
import pkg from './package.json' with {type:'json'};
const {agent,vars} = pkg.data;

import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';    
const __dirname = dirname(fileURLToPath(import.meta.url));

const info = {
  id: pkg.id,
  name: pkg.name,
  version: pkg.version,
  describe: pkg.description,
  dir: __dirname,
  url: pkg.homepage,
  git: pkg.repository.url,
  bugs: pkg.bugs.url,
  license: pkg.license,
  author: pkg.author,
  copyright: pkg.copyright,
};


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
    the interactions to json log file.
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
  onReady(data, resolve) {
    const {uri,database} = this.services().personal.mongo;
    this.modules.client = new MongoClient(uri);
    this.vars.database = database;
    this.prompt(this.vars.messages.ready)
    return resolve(data);
  },
  onError(err, data, reject) {
    this.prompt(this.vars.messages.error);
    console.log(err);
    return reject(err);
  }
});
export default LOG
