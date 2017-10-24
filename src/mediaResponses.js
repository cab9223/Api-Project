 // pull in all required data and modules
const fs = require('fs');
const path = require('path');
const logo = fs.readFileSync(`${__dirname}/../src/logo.png`);
const background = fs.readFileSync(`${__dirname}/../src/Digital.png`);
const border = fs.readFileSync(`${__dirname}/../src/Border.png`);
const picBorder = fs.readFileSync(`${__dirname}/../src/PicBorder.png`);
const background2 = fs.readFileSync(`${__dirname}/../src/circuitry.png`);
const ribbon = fs.readFileSync(`${__dirname}/../src/RedRibbon.png`); 

//Streaming fuction from earlier assignment
const streamFile = (request, response, file, fileType, stats) => {
  const range = request.headers.range;
  if (!range) {
    return response.writeHead(416);
  }

  const positions = range.replace(/bytes=/, '').split('-');

  let start = parseInt(positions[0], 10);

  const total = stats.size;
  const end = positions[1] ? parseInt(positions[1], 10) : total - 1;

  if (start > end) {
    start = end - 1;
  }

  const chunksize = (end - start) + 1;

  response.writeHead(206, {
    'Content-Range': `bytes ${start}-${end}/${total}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': chunksize,
    'Content-Type': fileType,
  });

  const stream = fs.createReadStream(file, { start, end });

  stream.on('open', () => {
    stream.pipe(response);
  });

  stream.on('error', (streamErr) => {
    response.end(streamErr);
  });

  return stream;
};

//Loading fuction from earlier assignment
const loadFile = (request, response, fileName, fileType) => {
  const file = path.resolve(__dirname, fileName);

  fs.stat(file, (err, stats) => {
    if (err) {
      if (err.code === 'ENOENT') {
        response.writeHead(404);
      }
      return response.end(err);
    }

    return streamFile(request, response, file, fileType, stats);
  });
};



// ALL of the gets for each file being shared
const getSong = (request, response) => {
  loadFile(request, response, '../client/scheming.mp3', 'audio/mpeg');
};
const getLogo = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'image/png' });
  response.write(logo);
  response.end();
};
const getRibbon = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'image/png' });
  response.write(ribbon);
  response.end();
};
const getBackground = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'image/png' });
  response.write(background);
  response.end();
};
const getBackground2 = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'image/png' });
  response.write(background2);
  response.end();
};
const getBorder = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'image/png' });
  response.write(border);
  response.end();
};
const getPicBorder = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'image/png' });
  response.write(picBorder);
  response.end();
};

module.exports = {
  getSong,
  getLogo,
  getRibbon,
  getBackground,
  getBackground2,
  getBorder,
  getPicBorder,
};

