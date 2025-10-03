"use strict";
// Copyright ©2025 Quinn A Michaels; All rights reserved. 
// Legal Signature Required For Lawful Use.
// Distributed under VLA:46605441065773246919 LICENSE.md

// Log Deva

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
    // log the question
    'devacore:question'(packet) {
      this.func.log_write('question', packet);
    },
    // log the answer
    'devacore:answer'(packet) {
      this.func.log_write('answer', packet);
    },
    // log deva sking another deva
    'devacore:ask'(packet) {
      this.func.log_write('ask', packet);
    },
    // log the answer on finish
    'devacore:finish'(packet) {
      this.func.log_write('finish', packet);
    },
    // log the answer on complete
    'devacore:complete'(packet) {
      this.func.log_write('complete', packet);
    },
    // log all errors
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
        return this.err(e, packet, false);
      } finally {
        return result;
      }
    },

  },
  methods: {
    log(packet) {
      return new Promise((resolve, reject) => {
        try {
          return resolve({})
        } catch (err) {
          return this.error(err, packet, reject);
        }
      });
    }
  },
  onInit(data, resolve) {
    const {personal} = this.license(); // get the license config
    const agent_license = this.info().VLA; // get agent license
    const license_check = this.license_check(personal, agent_license); // check license
    // return this.start if license_check passes otherwise stop.
    this.action('return', `onInit:${data.id.uid}`);
    return license_check ? this.start(data, resolve) : this.stop(data, resolve);
  }, 
  onReady(data, resolve) {
    const {VLA} = this.info();

    this.state('get', `mongo:global:${data.id.uid}`);
    const {uri,database} = this.log().global.mongo;
    this.state('set', `mongo:client:${data.id.uid}`);
    this.modules.client = new MongoClient(uri);
    this.state('set', `mongo:database:${data.id.uid}`);
    this.vars.database = database;

    this.prompt(`${this.vars.messages.ready} > VLA:${VLA.uid}`);

    this.action('resolve', `onReady:${data.id.uid}`);
    return resolve(data);
  },
  onError(err, data, reject) {
    this.prompt(this.vars.messages.error);
    this.action('reject', `onError:${data.id.uid}`);
    return reject(err);
  }
});
export default LOG
