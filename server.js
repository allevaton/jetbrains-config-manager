/**
 * Created by Nick on 2/8/2015.
 */

var open = require("open");
var http = require("http");
var fs = require("fs");
var querystring = require("querystring");

var api = require("./lib/jbcm_api");

var port = 15678;

String.prototype.startsWith = function (str) {
    return this.slice(0, str.length) === str;
};

http.createServer(function (request, response) {
    function writeResponse (statusCode, data) {
        response.writeHead(statusCode);
        response.write(data);
        response.end();
    }

    var url = request.url.substr(1);

    if (url === "") {
        fs.readFile("index.html", function (err, data) {
            if (err)
                console.error(err);
            else {
                writeResponse(200, data);
            }
        });
    } else if (url.startsWith("api/")) {
        url = url.substr(4); // trim off the beginning "api/"
        var split = url.split("?");
        var params = querystring.parse(split[1]);
        var res = api.parseUrl(split[0], params);

        writeResponse(res.httpStatus, JSON.stringify(res))
    } else {
        fs.readFile(url, function (err, data) {
            if (err) {
                console.error(err);
                if (err.code === "ENOENT") {
                    writeResponse(404, "File not found: " + url);
                }
            }
            else {
                writeResponse(200, data);
            }
        });
    }
}).listen(port);

open("http://localhost:" + port, function (err) {
    if (err)
        console.error(err);

    console.log('called');
});
