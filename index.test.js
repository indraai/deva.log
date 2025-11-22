"use strict";
// Copyright ©2000-2025 Quinn A Michaels; All rights reserved. 
// Legal Signature Required For Lawful Use.
// Distributed under VLA:18508198527557914092 LICENSE.md
// Saturday, November 22, 2025 - 9:40:09 AM

// Log Buddy test file

import {expect} from 'chai';
import LogDeva from './index.js';

describe(LogDeva.me.name, () => {
  beforeEach(() => {
    return LogDeva.init()
  });
  it('Check the DEVA Object', () => {
    expect(LogDeva).to.be.an('object');
    expect(LogDeva).to.have.property('agent');
    expect(LogDeva).to.have.property('vars');
    expect(LogDeva).to.have.property('listeners');
    expect(LogDeva).to.have.property('methods');
    expect(LogDeva).to.have.property('modules');
  });
})
