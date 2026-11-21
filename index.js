"use strict";
// Log Deva
// Copyright ©2000-2026 Quinn Michaels; All rights reserved.  
// Owner Signature Required For Lawful Use.  
// Distributed under VLA:50322929256393520124 LICENSE.md  
// Friday, November 20, 2026 - 4:41:52 PM PST

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
  author: pkg.author,
  describe: pkg.description,
  dir: __dirname,
  url: pkg.homepage,
  git: pkg.repository.url,
  bugs: pkg.bugs.url,
  license: pkg.license,
  VLA: pkg.VLA,
  copyright: pkg.copyright,
};

const LogDeva = new Deva({
  info,
  agent,
  vars,
  utils: {
    translate(input) {return input.trim();},
    parse(input) {return input.trim();},
    process(input) {return input.trim();}
  },
  listeners: {
    // log the question
    'devacore:question'(packet) {
      this.func.log_write('question', this.lib.copy(packet));
    },
    // log the answer
    'devacore:answer'(packet) {
      this.func.log_write('answer', this.lib.copy(packet));
    // log deva sking another deva
    },
    'devacore:ask'(packet) {
      this.func.log_write('ask', this.lib.copy(packet));
    },
    // log all errors
    'devacore:error'(packet) {
      this.func.log_write('error', this.lib.copy(packet));
    },
  },
  modules: {
    client: false,
  },
  devas: {},
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
        return this.err(e, packet, false);
      } finally {
        return result;
      }
    },

  },
  methods: {},
  onReady(data, resolve) {
    const {uri,database} = this.log().global?.mongo || {};
    const {VLA} = this.info();
    if (uri) this.modules.client = new MongoClient(uri); // build the client if uri is set
    this.vars.database = database;
    this.prompt(`${this.vars.messages.ready} > VLA:${VLA.uid}`);
    return resolve(data);
  },
  onError(err, data, reject) {
    this.prompt(this.vars.messages.error);
    console.log(err);
    return reject ? reject(err) : Promise.reject(err);
  }
});
export default LogDeva
