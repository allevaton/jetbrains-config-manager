/**
 * Created by Nick on 2/8/2015.
 */

var exports = module.exports = {};

var fs = require("fs");
var path = require("path");

/**
 * BASIC:
 * Most functions require the parameter "param," which is an object matching
 * the incoming query string.
 * Ex:
 *      This query string:
 *          apiCall?test=yes&moreTest=moreYes
 *      Is broken into a JSON object:
 *          {
 *              test: "yes",
 *              moreTest: "moreYes"
 *          }
 *
 * Each function MUST return JSON. This will be directly returned from the webpage.
 * If you do not supply "httpStatus" in the response object, one with the value "200" will be
 * automatically appended.
 */

/**
 * TODO:
 *  file exist checks before all IO
 */

exports.configs = {
    WebStorm9: ".WebStorm9",
    PyCharm40: ".PyCharm40",
    IntelliJ14: ".IntelliJIdea14",
    CLion10: ".clion10",
    PhpStorm8: ".PhpStorm8"
};

// These should directly relate to folder names in .IDE/config
exports.handledConfigs = [
    "codestyles",
    "colors",
    "inspection",
    "keymaps",
    "templates"
];

// TODO this needs a better name
Object.prototype.hasValue = function (value) {
    for (var prop in this)
        if (this.hasOwnProperty(prop) && this[prop] === value)
            return prop;
    return false;
};

String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
};

fs.makedirsSync = function (dir) {
    // TODO recursion over iteration
    var split = dir.split(path.sep);

    var toCreate = [];

    while (true) {
        if (fs.existsSync(path.join.apply(this, split)) || split.length === 0) {
            toCreate.forEach(function (d) {
                split.push(d);
                var newPath = path.join.apply(this, split);
                fs.mkdirSync(newPath);
            });
            break;
        }
        else {
            toCreate.push(split.pop());
        }
    }
};

/**
 * Discovers the API call to make based on the incoming URL.
 * @param call The incoming url from the web server
 * @param params Parameter object
 */
exports.parseUrl = function (call, params) {
    var response;
    if (this.hasOwnProperty(call)) {
        response = this[call](params);
        if (typeof response !== "object")
            response = this.test();

        if (!response.hasOwnProperty("httpStatus"))
            response.httpStatus = 200;
    }
    else {
        response = {
            error: "not found",
            description: "api call '" + call + "' was not found",
            call: call,
            params: params,
            httpStatus: 404
        }
    }

    return response;
};

exports.discoverConfigurations = function () {
    // find home directory
    var homeDir = process.env.HOME || process.env.USERPROFILE || process.env.HOMEPATH;

    var foundConfigs = [];
    var availableConfigs = exports.configs;

    var files = fs.readdirSync(homeDir);
    files.forEach(function (f) {
        var hasValue = availableConfigs.hasValue(f);

        if (hasValue) {
            foundConfigs.push({
                type: hasValue,
                location: path.join(homeDir, f)
            });
        }
    });

    return {foundConfigs: foundConfigs};
};

exports.getConfigOptions = function (params) {
    var configDir = path.join(params.location, "config");

    var availableConfigs = [];
    var handledConfigs = exports.handledConfigs;

    var dirs = fs.readdirSync(configDir);
    dirs.forEach(function (e) {
        if (handledConfigs.indexOf(e) > -1) {
            var files = [];
            fs.readdirSync(path.join(configDir, e)).forEach(function (f) {
                files.push({
                    name: f,
                    path: path.join(configDir, e, f)
                });
            });
            if (files.length > 0)
                availableConfigs.push({
                    name: e.toProperCase(),
                    files: files
                });
        }
    });

    return {availableConfigs: availableConfigs};
};

exports.getFile = function (params) {
    if (!(params.hasOwnProperty("path")))
        return {
            error: "path not found in parameters",
            params: params,
            httpStatus: 400
        };

    if (fs.existsSync(params.path))
        return {contents: fs.readFileSync(params.path).toString()};
    else
        return {
            error: "file does not exist",
            params: params,
            httpStatus: 404
        };
};

exports.renameFile = function (params) {
    if (!(params.hasOwnProperty("path"))) return {
        error: "path not found in parameters",
        params: params,
        httpStatus: 400
    };

    if (!(params.hasOwnProperty("newName"))) return {
        error: "new name not found in parameters",
        params: params,
        httpStatus: 400
    };

    var newPath = path.join(path.dirname(params.path), params.newName);
    try {
        fs.renameSync(params.path, newPath);
    }
    catch (e) {
        return {error: e};
    }

    return this.test();
};

exports.writeFile = function (params) {
    if (!(params.hasOwnProperty("path"))) return {
        error: "path not found in parameters",
        params: params,
        httpStatus: 400
    };

    if (!(params.hasOwnProperty("contents"))) return {
        error: "contents not found in parameters",
        params: params,
        httpStatus: 400
    };

    if (fs.existsSync(params.path)) {
        try {
            fs.writeFileSync(decodeURIComponent(params.path), decodeURIComponent(params.contents));
            return {response: "good"};
        }
        catch (e) {
            return {error: e};
        }
    }
    else
        return {
            error: "File '" + params.path + "' not found",
            params: params,
            httpStatus: 404
        }
};

exports.copyConfig = function (params) {
    if (!(params.hasOwnProperty("path"))) return {
        error: "path not found in parameters",
        params: params,
        httpStatus: 400
    };

    if (!(params.hasOwnProperty("ide"))) return {
        error: "ide not found in parameters",
        params: params,
        httpStatus: 400
    };

    // todo finish
    var srcPath = decodeURIComponent(params.path);

    /* Just in case we're only copying 1, we want the logic to stay the same,
     even though it's not passed in as an array */
    if (!Array.isArray(params.ide))
        params.ide = [params.ide];

    if (fs.existsSync(srcPath)) {
        var newPath = srcPath.split(path.sep);

        params.ide.forEach(function (e) {
            newPath.splice(newPath.length - 4, 1, exports.configs[decodeURIComponent(e)]);

            var dest = path.join.apply(this, newPath);

            fs.makedirsSync(path.dirname(dest));
            fs.createReadStream(srcPath).pipe(fs.createWriteStream(dest));
        });
    }
    else
        return {error: "path does not exist", params: params, httpStatus: 404};
};

/**
 * Just a test function
 * @returns {{response: string}}
 */
exports.test = function () {
    return {response: "good"};
};
