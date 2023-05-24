// Log Deva (c)2023 Quinn Michaels

const package = require('./package.json');
const info = {
  id: package.id,
  name: package.name,
  version: package.version,
  describe: package.description,
  url: package.homepage,
  git: package.repository.url,
  bugs: package.bugs.url,
  license: package.license,
  author: package.author,
  copyright: package.copyright,
};

const fs = require('fs');
const path = require('path');

const data_path = path.join(__dirname, 'data.json');
const {agent,vars} = require(data_path).DATA;

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
  listeners: {},
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
      this.func.log_write('error', packet);
    },

    /**************
    func: log_action
    params: packet
    describe: log the state changes in the machine.
    ***************/
    log_action(packet) {
      const isSelf = this.agent().id == packet.agent.id;
      this.func.log_write('action', packet);
    },

    /**************
    func: log_state
    params: packet
    describe: log the state changes in the machine.
    ***************/
    log_state(packet) {
      const isSelf = this.agent().id == packet.agent.id;
      this.func.log_write('state', packet);
    },

    /**************
    func: log_question
    params: packet
    describe: this is the logging mechanism for system questions.
    ***************/
    log_question(packet) {
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

      packet.client = client;
      packet.agent = agent;

      this.func.log_write('answer', packet);
    },

    log_write(type, packet) {
      const theDate = new Date();
      const theMonth = theDate.getMonth() + 1;
      const theYear = theDate.getFullYear();

      const theAgent = packet.agent.key;

      const theLoc = path.join(`${theAgent}`, `${type}`, `${theYear}`, `${theMonth}`)
      let theDir = path.join(__dirname, 'logs', `${theLoc}`)
      if (this.vars.log_dir) theDir = path.join(`${this.vars.log_dir}`, `${theLoc}`);
      const theFile = path.join(theDir, `${this.getToday()}.log`);

      return new Promise((resolve, reject) => {

        fs.mkdir(theDir, {recursive:true}, err => {
          if (err) return this.error(err, packet, reject);
          // first check for file and if it does not then write the base file for the day
          if (! fs.existsSync(theFile)) {
            const header = [
              `id: ${this.uid(true)}`,
              `type: ${type}`,
              `date: ${this.formatDate(theDate, 'long', true)}`,
              `copyright: Copyright (c) ${theDate.getFullYear()} Quinn Michaels, All Rights Reserved.`,
              '---',
            ].join('\n');
            fs.writeFileSync(theFile, header, {encoding:'utf8',flag:'w'});
          }

          // then after we check the file we are going to read the file and then add new data to the log.
          const log_data = [
            `id: ${this.uid(true)}`,
            `created: ${this.formatDate(Date.now(), 'short', true)}`,
            `packet: ${JSON.stringify(packet)}`,
            `hash: ${this.hash(JSON.stringify(packet), 'sha512')}`,
            '---'
          ].join('\n');
          fs.appendFile(theFile, log_data, 'utf8', err => {
            if (err) return this.error(err, packet, reject);
          });
        });
      });
    },
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
      return Promise.resolve(this.status());
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
  onDone(data) {
    const {profile} = this.client();
    if (profile.logs) this.vars.log_dir = profile.logs;

    this.listen('devacore:state', packet => {
      return this.func.log_state(this.copy(packet));
    });
    this.listen('devacore:action', packet => {
      return this.func.log_action(this.copy(packet));
    });
    this.listen('devacore:question', packet => {
      return this.func.log_question(this.copy(packet));
    });
    this.listen('devacore:answer', packet => {
      return this.func.log_answer(this.copy(packet));
    });
    this.listen('devacore:error', packet => {
      return this.func.log_error(this.copy(packet));
    });
    return Promise.resolve(this._messages.states.done);
  }
});
module.exports = LOG
