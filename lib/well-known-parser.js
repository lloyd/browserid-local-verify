/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var jwcrypto = require("jwcrypto");
var urlparse = require("urlparse");
var validation = require('./validation.js');

function validateUrlPath(path) {
  if (path[0] !== '/') {
    throw new Error("paths must start with a slash");
  }
  urlparse("http://example.com" + path).validate();
}

// parse a well-known document.  throw an exception if it is invalid, return
// a parsed version if it is valid.  return is an object having the following fields:
//   * 'type' - one of "disabled", "delegation", or "supported"
//   * if type is "delegation", also:
//     * authority - the domain authority is delegated to
//   * if type is "supported":
//     * publicKey - a parsed representation of the public key
//     * paths.authentication - the path to the 'authentication' html
//     * paths.provisioning - the path to the 'provisioning' html
module.exports = function(doc, allowURLOmission) {
  try {
    doc = JSON.parse(doc);
  } catch(e) {
    throw new Error("declaration of support is malformed (invalid json)");
  }

  if (typeof doc !== 'object') {
    throw new Error("support document must contain a json object");
  }

  // there are three main types of support documents
  // 1. "supported" - declares the domain is a browserid authority,
  //    contains public-key, authentication, and provisioning
  // 2. "delegation" - declares the domain allows a different domain
  //    to be authoritative for it.
  // 3. "disable" - domain declares explicitly that it wants a secondary
  //    to be authoritative.

  // is this a "disable" document?
  if (doc.disabled === true) {
    return { type: "disabled" };
  } else if (doc.disabled !== undefined && doc.disabled !== false) {
    throw new Error("disabled must be either true or false");
  }

  // is this a delegation document?
  if (doc.authority) {
    if (typeof doc.authority !== 'string') {
      throw new Error("malformed authority");
    }
    try {
      validation.validateAuthority(doc.authority);
    } catch (e) {
      throw new Error("the authority is not a valid hostname");
    }

    return {
      type: "delegation",
      authority: doc.authority
    };
  }

  // is this a support document?

  // the response that we'll populate as we go
  var parsed = {
    type: "supported",
    paths: {},
    publicKey: null
  };

  [ 'authentication', 'provisioning' ].forEach(function(requiredKey) {
    if (typeof doc[requiredKey] !== 'string') {
      if (!allowURLOmission) {
        throw new Error("support document missing required property: '" + requiredKey + "'");
      }
    } else {
      validateUrlPath(doc[requiredKey]);
      parsed.paths[requiredKey] = doc[requiredKey];
    }
  });

  if (!doc['public-key']) {
    throw new Error("support document missing required 'public-key'");
  }

  // can we parse that key?
  try {
    parsed.publicKey = jwcrypto.loadPublicKeyFromObject(doc['public-key']);
  } catch(e) {
    throw new Error("mal-formed public key in support doc: " + e.toString());
  }

  // success!
  return parsed;
};
