// Log Deva (c)2023 Quinn Michaels

const package = require('./package.json');
const info = {
  name: package.name,
  version: package.version,
  author: package.author,
  describe: package.describe,
  url: package.homepage,
  git: package.repository.url,
  bugs: package.bugs.url,
  license: package.license,
  copyright: package.copyright
};

const fs = require('fs');
const path = require('path');

const data_path = path.join(__dirname, 'data.json');
const {agent,vars} = require(data_path).data;

const Deva = require('@indra.ai/deva');
const LOG = new Deva({
  info,
  agent: {
    id: agent.id,
    key: agent.key,
    prompt: agent.prompt,
    voice: agent.voice,
    profile: agent.profile,
    translate(input) {
      return input.trim();
    },
    parse(input) {
      return input.trim();
    }
  },
  vars,
  listeners: {
    'devacore:state'(packet) {
      return this.func.log_state(packet);
    },
    'devacore:action'(packet) {
      return this.func.log_action(packet);
    },
    'devacore:question'(packet) {
      return this.func.log_question(packet);
    },
    'devacore:answer'(packet) {
      return this.func.log_answer(packet);
    },
    'devacore:error'(packet) {
      return this.func.log_error(packet);
    },
  },
  modules: {},
  deva: {},
  func: {
    /**************
    func: log_error
    params: packet
    describe: log the error in the machine.
    ***************/
    log_error(packet) {
      const isSelf = this.agent().id == packet.agent.id;

      this.talk(this.vars.relay, {
        id: this.uid(),
        key: 'log',
        value: 'error',
        agent: this.agent(),
        client: this.client(),
        text: `🏃‍♂️ ${packet.agent.profile.name} action change to ${packet.value}`,
        created: Date.now(),
      });

      this.func.log_write('error', packet);
    },

    /**************
    func: log_action
    params: packet
    describe: log the state changes in the machine.
    ***************/
    log_action(packet) {
      const isSelf = this.agent().id == packet.agent.id;

      this.talk(this.vars.relay, {
        id: this.uid(),
        key: 'log',
        value: 'action',
        agent: this.agent(),
        client: this.client(),
        text: `🏃‍♂️ ${packet.agent.profile.name} action change to ${packet.value}`,
        created: Date.now(),
      });

      this.func.log_write('action', packet);
    },

    /**************
    func: log_state
    params: packet
    describe: log the state changes in the machine.
    ***************/
    log_state(packet) {
      const isSelf = this.agent().id == packet.agent.id;

      this.talk(this.vars.relay, {
        id: this.uid(),
        key: 'log',
        value: 'state',
        agent: this.agent(),
        client: this.client(),
        text: `🐒 ${packet.agent.profile.name} state change to ${packet.value}`,
        created: Date.now(),
      });

      this.func.log_write('state', packet);
    },

    /**************
    func: log_question
    params: packet
    describe: this is the logging mechanism for system questions.
    ***************/
    log_question(packet) {

      // talk event to notify the cli
      this.talk(this.vars.relay, {
        id: this.uid(),
        key: 'log',
        value: 'question',
        agent: this.agent(),
        client: this.client(),
        text: `👤 ${this._agent.profile.name} logs a question from ${packet.q.client.profile.name}`,
        created: Date.now(),
      });

      const client = packet.q.client.id;
      const agent = {
        id: packet.q.agent.id,
        key: packet.q.agent.key,
        name: packet.q.agent.name,
      };

      delete packet.q.client;
      delete packet.q.agent;
      delete packet.a;

      packet.client = client;
      packet.agent = agent;

      this.func.log_write('question', packet);

    },

    /**************
    func: log_answer
    params: packet
    describe: this is the logging mechanism for system questions.
    ***************/
    log_answer(packet) {
      // talk even tto notify the cli
      this.talk(this.vars.relay, {
        id: this.uid(),
        key: 'log',
        value: 'answer',
        agent: this.answer(),
        client: this.client(),
        text: `🗣️  ${this._agent.profile.name} logs an answer from ${packet.a.agent.profile.name}`,
        created: Date.now(),
      });

      const client = packet.a.client.id;
      const agent = {
        id: packet.a.agent.id,
        key: packet.a.agent.key,
        name: packet.a.agent.name,
      };

      delete packet.a.client;
      delete packet.a.agent;
      delete packet.a.client;
      delete packet.a.agent;
      delete packet.q;

      this.client() = client;
      packet.agent = agent;

      this.func.log_write('answer', packet);

    },

    log_write(type, packet) {
      const theDate = new Date();
      const theMonth = theDate.getMonth() + 1;
      const theYear = theDate.getFullYear();

      const theAgent = packet.agent.key;

      const theDir = path.join(__dirname, '..', '..', '..', 'logs', `${theAgent}`, `${type}`, `${theYear}`, `${theMonth}`);
      const theFile = path.join(theDir, `${this.getToday()}.json`);


      return new Promise((resolve, reject) => {

        fs.mkdir(theDir, {recursive:true}, err => {
          if (err) return reject(err);
          // first check for file and if it does not then write the base file for the day
          if (! fs.existsSync(theFile)) {
            const json = {
              id: this.uid(),
              date: this.formatDate(theDate, 'long', true),
              type,
              copyright: `Copyright (c) ${theDate.getFullYear()} indra.ai, All Rights Reserved.`,
              data: [],
            };
            const data = JSON.stringify(json);
            fs.writeFileSync(theFile, data, {encoding:'utf8',flag:'w'});
          }

          // then after we check the file we are going to read the file and then add new data to the log.
          const raw = fs.readFileSync(theFile);
          const log = JSON.parse(raw);
          const log_data = {
            guid: this.uid(true),
            packet: JSON.stringify(packet),
            created: Date.now(),
          };
          log.data.push(log_data);
          log.hash = this.hash(JSON.stringify(log.data, null, 2), 'sha512');
          fs.writeFileSync(theFile, JSON.stringify(log, null, 2), {encoding:'utf8',flag:'w'});
        });
      });
    }
  },
  methods: {
    /**************
    method: uid
    params: packet
    describe: Return a system id to the user from the Log Buddy.
    ***************/
    uid(packet) {
      return Promise.resolve({text:this.uid()});
    },

    /**************
    method: status
    params: packet
    describe: Return the current status of the Log Buddy.
    ***************/
    status(packet) {
      return this.status();
    },

    /**************
    method: help
    params: packet
    describe: The Help method returns the information on how to use the Log Buddy.
    ***************/
    help(packet) {
      return new Promise((resolve, reject) => {
        this.lib.help(packet.q.text, __dirname).then(help => {
          return this.question(`#feecting parse ${help}`);
        }).then(parsed => {
          return resolve({
            text: parsed.a.text,
            html: parsed.a.html,
            data: parsed.a.data,
          });
        }).catch(reject);
      });
    }
  },
});
module.exports = LOG
