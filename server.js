var http = require('http');
var fs = require('fs');

var restify = require('restify');
var FFmpeg = require('fluent-ffmpeg');
var gm = require('gm');

var encode = function(req, res, next) {
    var sourceUrl = req.params.url;
    var file = fs.createWriteStream('./file');
    var request = http.get(sourceUrl, function(response) {
        console.log('Downloading file...');
        response.pipe(file);
        file.on('finish', function() {
            file.close();
            console.log('Transcoding...');
            var command = new FFmpeg({source: './file'});
            command.setFfmpegPath('./ffmpeg');
            command.withNoAudio()
                .toFormat('webm')
                .on('error', function(err) {
                    console.log('Error: ' + err.message);
                    res.send('Failed');
                    next();
                })
                .on('end', function() {
                    console.log('Success');
                    var rs = fs.createReadStream('./output.webm');
                    rs.pipe(res);
                    next();
                })
                .saveToFile('./output.webm');
        });
    });
};

var transformImage = function(req, res, next) {
    var sourceUrl = req.params.url;
    var file = fs.createWriteStream('./image');
    var request = http.get(sourceUrl, function(response) {
        console.log('Downloading source image...');
        response.pipe(file);
        file.on('finish', function() {
            file.close();
            console.log('Transcoding...');
            gm('./image')
                .resize(250, 250)
                .write('./out.gif', function(err) {
                    if (err) {
                        console.log('Error: ' + err);
                        res.send('Failed');
                    }
                    else {
                        console.log('Success');
                        var rs = fs.createReadStream('./out.gif');
                        rs.pipe(res);
                    }
                    next();
                });
        });
    });
};

var server = restify.createServer();
server.get('/encode/:url', encode);
server.get('/image/:url', transformImage);

server.listen(3000, function() {});
