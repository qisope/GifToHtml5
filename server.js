var http = require('http');
var fs = require('fs');

var restify = require('restify');
var FFmpeg = require('fluent-ffmpeg');

function encode(req, res, next) {
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
                    next();
                })
                .on('end', function() {
                    console.log('Success');
                    next();
                })
                .saveToFile('./output.webm');
        });
    });
}

var server = restify.createServer();
server.get('/encode/:url', encode);

server.listen(3000, function() {});
