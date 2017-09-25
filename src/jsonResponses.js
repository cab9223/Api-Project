// Node's built-in cryptography module.
// Requires openssl to be installed (usually on every OS).
// Openssl does the cryptography/encryption for most
// OSes and languages.
// You can actually see all the algorithms on your OS
// by opening git bash typing the following (without quotes)
// 'openssl  list-message-digest-algorithms'
const crypto = require('crypto');

// Note this object is purely in memory
// When node shuts down this will be cleared.
// Same when your heroku app shuts down from inactivity
// We will be working with databases in the next few weeks.
const users = {};

// sha1 is a bit of a quicker hash algorithm for insecure things
// It's a standard library for insecure data hashes
// For more security, you want sha512 or an actual encryption algorithm
// Those algorithms are *FAR* more expensive, but will increase security.
// You just want to ensure you know whether you want encryption or hashing.
// For VERY fast INSECURE hashing, you can use xxhash (not built into node).
let etag = crypto.createHash('sha1').update(JSON.stringify(users));
let digest = etag.digest('hex');

// function to respond with a json object
// takes request, response, status code and object to send
const respondJSON = (request, response, status, object) => {
  // object for our headers
  // Content-Type for json
  // etag to version response 
  // etag is a unique versioning number of an object
  const headers = {
    'Content-Type': 'application/json',
    etag: digest,
  };

  // send response with json object
  response.writeHead(status, headers);
  response.write(JSON.stringify(object));
  response.end();
};

// function to respond without json body
// takes request, response and status code
const respondJSONMeta = (request, response, status) => {
  // object for our headers
  // Content-Type for json
  // etag to version response 
  // etag is a unique versioning number of an object
  const headers = {
    'Content-Type': 'application/json',
    etag: digest,
  };

  // send response without json object, just headers
  response.writeHead(status, headers);
  response.end();
};

// get user object
// should calculate a 200 or 304 based on etag
const getUsers = (request, response) => {
  // json object to send
  const responseJSON = {
    users,
  };

  // check the client's if-none-match header to see the version
  // number the client is returning (from etag)
  // If the version number (originally set by the server in etag)
  // is the same as our current one, then send a 304
  // 304 cannot have a body in it.
  if (request.headers['if-none-match'] === digest) {
    // return 304 response without message 
    // 304 is not modified and cannot have a body field
    // 304 will tell the browser to pull from cache instead
    return respondJSONMeta(request, response, 304);
  }

  // return 200 with message
  return respondJSON(request, response, 200, responseJSON);
};

// get meta info about user object
// should calculate a 200 or 304 based on etag
const getUsersMeta = (request, response) => {
  // check the client's if-none-match header to see the version
  // number the client is returning (from etag)
  // If the version number (originally set by the server in etag)
  // is the same as our current one, then send a 304
  // 304 cannot have a body in it.
  if (request.headers['if-none-match'] === digest) {
    return respondJSONMeta(request, response, 304);
  }

  // return 200 without message, just the meta data
  return respondJSONMeta(request, response, 200);
};

// function just to update our object and recalculate etag
const updateUser = () => {
  // creating a new hash object 
  etag = crypto.createHash('sha1').update(JSON.stringify(users));
  // recalculating the hash digest for etag
  digest = etag.digest('hex');
  // console.log('ETAG');
};

// function to add a user from a POST body
const addUser = (request, response, body) => {
  // default json message
  const responseJSON = {
    message: 'Name and age are both required.',
  };

  // check to make sure we have both fields
  // We might want more validation than just checking if they exist
  // This could easily be abused with invalid types (such as booleans, numbers, etc)
  // If either are missing, send back an error message as a 400 badRequest
  if (!body.name || !body.age) {
    responseJSON.id = 'missingParams';
    return respondJSON(request, response, 400, responseJSON);
  }

  // default status code to 201 created
  let responseCode = 201;

  // if that user's name already exists in our object
  // then switch to a 204 updated status
  if (users[body.name]) {
    responseCode = 204;
  } else {
    // otherwise create an object with that name
    users[body.name] = {};
  }

  // add or update fields for this user name
  users[body.name].name = body.name;
  users[body.name].age = body.age;

  updateUser();

  // if response is created, then set our created message
  // and sent response with a message
  if (responseCode === 201) {
    responseJSON.message = 'Created Successfully';
    return respondJSON(request, response, responseCode, responseJSON);
  }
  // 204 has an empty payload, just a success
  // It cannot have a body, so we just send a 204 without a message
  // 204 will not alter the browser in any way!!!
  return respondJSONMeta(request, response, responseCode);
};

// function for 404 not found requests with message
const notFound = (request, response) => {
  // create error message for response
  const responseJSON = {
    message: 'The page you are looking for was not found.',
    id: 'notFound',
  };

  // return a 404 with an error message
  respondJSON(request, response, 404, responseJSON);
};

// function for 404 not found without message
const notFoundMeta = (request, response) => {
  // return a 404 without an error message
  respondJSONMeta(request, response, 404);
};

// set public modules
module.exports = {
  addUser,
  getUsers,
  getUsersMeta,
  updateUser,
  notFound,
  notFoundMeta,
};
