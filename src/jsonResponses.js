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

//Containers for user data
const allUsers = {};
let users = {};
let sUsers = {};

//Data used for meta data
const keyValArray = [];
let keyValArray2 = [];
let characterNum = 0;
let sIndex = 0;
let isSearch = false;

// sha1 is a bit of a quicker hash algorithm for insecure things
// It's a standard library for insecure data hashes
// For more security, you want sha512 or an actual encryption algorithm
// Those algorithms are *FAR* more expensive, but will increase security.
// You just want to ensure you know whether you want encryption or hashing.
// For VERY fast INSECURE hashing, you can use xxhash (not built into node).
let etag = crypto.createHash('sha1').update(JSON.stringify(allUsers));
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
    index: keyValArray,
    count: characterNum,
    count2: sIndex,
    index2: keyValArray2,
    isSearch,
    isHead: false,
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
    index: keyValArray,
    count: characterNum,
    count2: sIndex,
    index2: keyValArray2,
    isSearch,
    isHead: true,
  };

  // send response without json object, just headers
  response.writeHead(status, headers);
  response.end();
};

// get user object
// should calculate a 200 or 304 based on etag
const getUsers = (request, response) => {
  isSearch = false;
  users = allUsers;

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

const searchUsers = (request, response, params) => {
  // json object to send
  let responseJSON = {};

  //check parameters
  if (!params.sName || params.sName === '') {
	//if not a search
    isSearch = false;
    users = allUsers;
    responseJSON = {
      users,
    };
  } else {
	//If a search
    isSearch = true;
    users = allUsers;

    const temp = keyValArray;

    sUsers = {};
    sIndex = 0;
    keyValArray2 = [];
    //Check search term with wild card characters for any matches
    for (let x = 0; x < characterNum; x++) {
      const check = new RegExp(params.sName);
      if (!!check.test(users[temp[x]].name) === true) {
        sUsers[users[temp[x]].name] = users[temp[x]];
        keyValArray2[sIndex] = users[temp[x]].name;
        sIndex++;
      }
    }

	//Set search response data
    users = sUsers;
    responseJSON = {
      users,
    };
  }

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
  isSearch = false;
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


const searchUsersMeta = (request, response, params) => {
  if (!params.sName || params.sName === '') {
	//If not a search
    isSearch = false;
  } else {
	//If a search
    isSearch = true;
    users = allUsers;

    const temp = keyValArray;

    sUsers = {};
    sIndex = 0;
    keyValArray2 = [];
    //Check search term with wild card characters for any matches
    for (let x = 0; x < characterNum; x++) {
      const check = new RegExp(params.sName);
      if (!!check.test(users[temp[x]].name) === true) {
        sUsers[users[temp[x]].name] = users[temp[x]];
        keyValArray2[sIndex] = users[temp[x]].name;
        sIndex++;
      }
    }
  }


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
  etag = crypto.createHash('sha1').update(JSON.stringify(allUsers));
  // recalculating the hash digest for etag
  digest = etag.digest('hex');
  // console.log('ETAG');
};

// function to add a user from a POST body
const addUser = (request, response, body) => {
  // default json message
  const responseJSON = {
    message: 'All fields are required.',
  };

  isSearch = false;

  
  // If any are missing, send back an error message as a 400 badRequest
  if (body.level < 5) {
    if (!body.name || !body.character || !body.level || body.mods0 === 'select') {
      responseJSON.id = 'missingParams';
      return respondJSON(request, response, 400, responseJSON);
    }
  } else if (body.level > 19) {
    if (!body.name || !body.character || !body.level || body.mods0 === 'select' || body.mods1 === 'select' || body.mods2 === 'select' || body.mods3 === 'select' || body.mods4 === 'select' || body.mods5 === 'select' || body.mods6 === 'select' || body.mods7 === 'select') {
      responseJSON.id = 'missingParams';
      return respondJSON(request, response, 400, responseJSON);
    }
  } else if (body.level > 14) {
    if (!body.name || !body.character || !body.level || body.mods0 === 'select' || body.mods1 === 'select' || body.mods2 === 'select' || body.mods3 === 'select' || body.mods4 === 'select' || body.mods5 === 'select') {
      responseJSON.id = 'missingParams';
      return respondJSON(request, response, 400, responseJSON);
    }
  } else if (body.level > 9) {
    if (!body.name || !body.character || !body.level || body.mods0 === 'select' || body.mods1 === 'select' || body.mods2 === 'select' || body.mods3 === 'select') {
      responseJSON.id = 'missingParams';
      return respondJSON(request, response, 400, responseJSON);
    }
  } else if (body.level > 4) {
    if (!body.name || !body.character || !body.level || body.mods0 === 'select' || body.mods1 === 'select' || body.mods2 === 'select') {
      responseJSON.id = 'missingParams';
      return respondJSON(request, response, 400, responseJSON);
    }
  }

  // default status code to 201 created
  let responseCode = 201;

  // if that user's name already exists in our object
  // then switch to a 204 updated status
  if (allUsers[body.name]) {
    responseCode = 204;
  } else {
    // otherwise create an object with that name
    allUsers[body.name] = {};
    allUsers[body.name].characterNum = characterNum;
    keyValArray[characterNum] = body.name;
    characterNum++;
  }

  // add or update fields for this user name
  allUsers[body.name].name = body.name;
  allUsers[body.name].character = body.character;
  allUsers[body.name].level = body.level;
  allUsers[body.name].image = body.image;
  allUsers[body.name].special1 = body.special1;
  allUsers[body.name].special2 = body.special2;
  allUsers[body.name].special3 = body.special3;
  allUsers[body.name].mod0 = body.mods0;
  allUsers[body.name].mod1 = body.mods1;
  allUsers[body.name].mod2 = body.mods2;
  allUsers[body.name].mod3 = body.mods3;
  allUsers[body.name].mod4 = body.mods4;
  allUsers[body.name].mod5 = body.mods5;
  allUsers[body.name].mod6 = body.mods6;
  allUsers[body.name].mod7 = body.mods7;

  //Update user etag
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
  searchUsers,
  getUsersMeta,
  searchUsersMeta,
  updateUser,
  notFound,
  notFoundMeta,
};
