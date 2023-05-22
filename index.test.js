// Copyright (c)2023 Quinn Michaels
// Log Buddy test file

const {expect} = require('chai')
const log = require('./index.js');

describe(log.me.name, () => {
  beforeEach(() => {
    return log.init()
  });
  it('Check the DEVA Object', () => {
    expect(log).to.be.an('object');
    expect(log).to.have.property('agent');
    expect(log).to.have.property('vars');
    expect(log).to.have.property('listeners');
    expect(log).to.have.property('methods');
    expect(log).to.have.property('modules');
  });
})
