// ©2025 Quinn A Michaels; All rights reserved. 
// Legal Signature Required For Lawful Use.
// Distributed under the Vedic License Agreement LICENSE.md

// Log Buddy test file

import {expect} from 'chai';
import log from './index.js';

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
