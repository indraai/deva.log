// Log Deva (c)2023 Quinn Michaels
// Log Deva handles logging events
const Deva = require('@indra.ai/deva');

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
  modules: {},
  deva: {},
  func: {
    /**************
    func: log_question
    params: packet
    describe: this is the logging mechanism for system questions.
    ***************/
    log_question(packet) {
      const p = this.copy(packet);
      const client = p.q.client.id;
      const agent = {
        id: p.q.agent.id,
        key: p.q.agent.key,
        name: p.q.agent.name,
      };
      p.client = client;
      p.agent = agent;

      this.func.log_write('question', p);
    },

    /**************
    func: log_answer
    params: packet
    describe: this is the logging mechanism for system questions.
    ***************/
    log_answer(packet) {
      const p = this.copy(packet);
      const client = p.a.client.id;
      const agent = {
        id: p.a.agent.id,
        key: p.a.agent.key,
        name: p.a.agent.name,
      };
      p.client = client;
      p.agent = agent;

      this.func.log_write('answer', p);
    },

    /**************
    func: log_ask
    params: packet
    describe: this is the logging mechanism for system questions.
    ***************/
    log_ask(packet) {
      const p = this.copy(packet);
      const client = p.a.client.id;
      const agent = {
        id: p.a.agent.id,
        key: p.a.agent.key,
        name: p.a.agent.name,
      };
      p.client = client;
      p.agent = agent;

      this.func.log_write('ask', p);
    },

    /**************
    func: log_write
    params: type, packet
    describe: this is the log file writer function that handles writing
    the interactions to json logfile.
    ***************/
    log_write(type, packet) {
      const theUTC = Date.now();
      const theDate = new Date(theUTC);
      const tempMonth = theDate.getMonth() + 1;
      const theMonth = tempMonth < 10 ? `0${tempMonth}` : tempMonth;
      const theYear = theDate.getFullYear();
      const theAgent = packet.agent.key;
      const theLoc = path.join('logs', 'devas', `${theAgent}`, `${type}`, `${theYear}`, `${theMonth}`)

      let theDir = path.join(__dirname, `${theLoc}`)
      if (this.config.dir) theDir = path.join(this.config.dir, theLoc);
      const theFile = path.join(theDir, `${theUTC}.json`);
      return new Promise((resolve, reject) => {
        fs.mkdir(theDir, {recursive:true}, err => {
          if (err) return this.error(err, pack, reject);
          // first check for file and if it does not then write the base file for the day
          if (!fs.existsSync(theFile)) {
            const saveJSON = {
              id: this.uid(true),
              type,
              date: this.formatDate(theDate, 'long', true),
              created: theDate,
              copyright: `Copyright (c) ${theDate.getFullYear()} Quinn Michaels, All Rights Reserved.`,
              DATA: packet,
            }
            fs.writeFileSync(theFile, JSON.stringify(saveJSON, null, 2), {encoding:'utf8',flag:'w'});
          }
        });
      });
    },
  },
  methods: {},
  onDone(data) {
    // this.listen('devacore:state', packet => {
    //   return this.func.log_state(packet);
    // });
    // this.listen('devacore:action', packet => {
    //   return this.func.log_action(packet);
    // });
    // this.listen('devacore:feature', packet => {
    //   return this.func.log_feature(packet);
    // });
    // this.listen('devacore:zone', packet => {
    //   return this.func.log_zone(packet);
    // });
    // this.listen('devacore:context', packet => {
    //   return this.func.log_context(packet);
    // });
    this.listen('devacore:question', packet => {
      return this.func.log_question(packet);
    });
    this.listen('devacore:answer', packet => {
      return this.func.log_answer(packet);
    });
    this.listen('devacore:ask', packet => {
      return this.func.log_ask(packet);
    });
    this.listen('devacore:error', packet => {
      return this.func.log_error(packet);
    });
    return Promise.resolve(data);
  }
});
module.exports = LOG
