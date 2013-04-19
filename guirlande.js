var request = require('request');
var _ = require('underscore');
var nconf = require('nconf');

// Load the config.json configuration file
// You can use the config.json.template to create yours
nconf.use('file', { file: './config.json' });
nconf.load();

var build1Url = nconf.get("build1Url");
var build2Url = nconf.get("build2Url");
var m3daServerUrl = nconf.get("m3daServerUrl");
var DEVICE_ID = nconf.get("deviceId");
var POLLING_PERIOD = nconf.get("pollingPeriod");

var configError = false;
if (!build1Url) {
    console.error("## Config errror : 'build1Url' value not set.");
    configError = true;
}

if (!build2Url) {
    console.error("## Config errror : 'build2Url' value not set.");
    configError = true;
}

if (!m3daServerUrl) {
    console.error("## Config errror : 'm3daServerUrl' value not set.");
    configError = true;
}

if (!DEVICE_ID) {
    console.error("## Config errror : 'deviceId' value not set.");
    configError = true;
}

if (configError) {
    console.error("## Please check the your config.json file.");
    return;
}

if (!POLLING_PERIOD) {
    POLLING_PERIOD = 30000; // Default value is 30 seconds
}

var guirlandeUri = "/m3da/data/" + DEVICE_ID;


// Define the default colors
// TODO : change format and move them to the config.json.template
var colors = {
    grey : { red : 100, green : 100, blue : 100 },
    aborted : { red : 100, green : 100, blue : 100 },
    yellow : {  red : 168, green : 153, blue : 40 },
    blue : { red : 13, green : 13, blue : 163 },
    red : { red : 201, green : 18, blue : 18 },
    white : { red : 100, green : 100, blue : 100 },
    green : { red : 6, green : 117, blue : 15 },
    black : {red : 0 , green : 0, blue: 0}
};

// Extend the default colors to define the same colors in blinking state
colors = _.extend(colors, {
    aborted_anime : _.extend(_.clone(colors.aborted), { blink : true}),
    yellow_anime : _.extend(_.clone(colors.yellow), { blink : true}),
    blue_anime : _.extend(_.clone(colors.blue), { blink : true}),
    red_anime : _.extend(_.clone(colors.red), { blink : true})
});

var pixels = [];


/**
 * Get the latest build of the given build
 * 
 * @param  {String}   buildUrl jenkins build url to monitor
 * @param  {Function} callback called with the last build object
 * 
 */
var getBuild = function(buildUrl, callback) {
    request({
            url : buildUrl,
            strictSSL : false
        },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var build = JSON.parse(body);
                callback(build.color, build.lastBuild.url);
            }
    });
};

/**
 * Retrieve the latest build 
 * 
 * @param  {String} lastBuildUrl
 */
var getLastBuildStatus = function(lastBuildUrl, callback) {
    request({
            url : lastBuildUrl + "/api/json",
            strictSSL : false
        },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var lastBuild = JSON.parse(body);

                // console.log("Last build ", lastBuild);
                if(callback) {
                    callback(lastBuild);
                }
            }
    });
};

/**
 * Process the build status to update the guirlande
 * 
 * @param  {String} color, corresponds to the status.
 * @param  {Object} buildStatus, see Jenkins API for more details
 */
var processBuildStatus = function(color, buildStatus) {
    console.log(" Process build >> ", buildStatus.fullDisplayName);
    console.log(" ", buildStatus.result, " => push 24 ", color, " pixels");
    _.each(_.range(24), function(){
        pixels.push(colors[color]);
    });

    // Look for claiming information
    var claimedStatus = _.find(buildStatus.actions, function(action) {
        return action.claimed;
    });

    // Does anyone has claimed this build ?
    var claimColor = colors.white;
    if (claimedStatus) {
        console.log(" Claimed => push 4 green");
        claimColor = colors.green;
    } else {
        console.log(" Not claimed => push 4 white");
    }

    _.each(_.range(4), function(){
        pixels.push(claimColor);
    });
};

/**
 * Send a command to the m3da server to update the guirlande.
 * 
 * @param  {Array} pixels , Array of colors
 * 
 */
var sendPixels = function(pixels) {
    var command = {
        settings : [{
            key : "leds.writePixels",
            value : pixels
        }]
    };

    console.log("\n >>> Send pixels !");

    request({
        url : m3daServerUrl + guirlandeUri,
        method : "POST",
        body : JSON.stringify(command)
    },
    function(error, response, body) {
        if(error) {
            console.log(" <<<< Oops something went wrong ...");
            console.log(body);
        } else {
            console.log(" <<<< Pixels updated !");
        }
        console.log(" ### Next check in ", POLLING_PERIOD / 1000, "seconds");
    });
};

// Go go go !
console.log("############################################");
console.log("      Let's go ! ...in", POLLING_PERIOD / 1000, "seconds");
console.log("############################################");
var checkNumber = 0;
setInterval(function() {
    console.log("\n -- Ctrl-C to stop harassing Jenkins");
    // Clean the possible last array of pixels
    pixels = [];
    checkNumber++;

    console.log("\n\nGet avop trunk status #", checkNumber);

    getBuild(build1Url, function(buildColor, lastBuildUrl) {
        getLastBuildStatus(lastBuildUrl, function(lastBuild) {
            // Extract the necessary info and call the guirlande API.
            processBuildStatus(buildColor, lastBuild);

            // Push 8 white pixels to delimited the 2 builds
            _.each(_.range(8), function() {
                pixels.push(colors.black);
            });

            console.log("\n\nGet avop branch status");
            getBuild(build2Url, function(buildColor, lastBuildUrl) {
                getLastBuildStatus(lastBuildUrl, function(lastBuild) {
                    // Extract the necessary info and call the guirlande API.
                    processBuildStatus(buildColor, lastBuild);

                    // Finally send the command to update the guirlande
                    sendPixels(pixels);
                });
            });
        });
    });
}, POLLING_PERIOD);
