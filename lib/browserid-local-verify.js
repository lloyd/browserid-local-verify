/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var
util = require("util"),
events = require("events"),
_ = require('underscore');

function Verifier(args) {
  events.EventEmitter.call(this);
  this.args = _.extend({
    'maxDelegations': 5,
    'httpTimeout': 10.0,
    'insecureSSL': false,
    'forceInsecureLookupOverHTTP': false
  }, args);
}

util.inherits(Verifier, events.EventEmitter);

var lookup = require('./lookup.js');
Verifier.prototype.lookup = function(args, cb) {
  if (!cb) {
    cb = args;
    args = {};
  }
  lookup(this, _.extend({}, this.args, args), cb);
};

var verify = require('./verify.js');
Verifier.prototype.verify = function(args, cb) {
  if (!cb) {
    cb = args;
    args = {};
  }
  verify(this, _.extend({}, this.args, args), cb);
};

module.exports = Verifier;

module.exports.lookup = function(args, cb) {
  if (!cb) {
    cb = args;
    args = {};
  }
  var v = new Verifier(args);
  v.lookup(cb);
};

module.exports.verify = function(args, cb) {
  var v = new Verifier(args);
  v.verify(cb);
};

// expose utility function for testing
module.exports.compareAudiences = require('./compare-audiences');
