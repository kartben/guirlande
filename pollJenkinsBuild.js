var request = require('request');
var _ = require('underscore');

var avopTrunkBuildUrl = "https://jenkins.anyware/platform-new/job/avop-trunk/api/json";
var avopBranchBuildUrl = "https://jenkins.anyware/platform-new/job/avop-13.2.x/api/json";
var m3daServerUrl = "http://m2m.eclipse.org";
var DEVICE_ID = "guirlande-CHANGEME";
var guirlandeUri = "/m3da/data/" + DEVICE_ID;

var POLLING_PERIOD = 5000; // Every 5 seconds

// Define the default colors
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
 * Extract the necessary info to let the magic happen on the LED strip :)
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
console.log("####      Let's go ! ...in", POLLING_PERIOD / 1000, "seconds     ###");
console.log("############################################");
var checkNumber = 0;
setInterval(function() {
    console.log("\n -- Ctrl-C to stop harassing Jenkins");
    // Clean the possible last array of pixels
    pixels = [];
    checkNumber++;

    console.log("\n\nGet avop trunk status #", checkNumber);

    getBuild(avopTrunkBuildUrl, function(buildColor, lastBuildUrl) {
        getLastBuildStatus(lastBuildUrl, function(lastBuild) {
            // Extract the necessary info and call the guirlande API.
            processBuildStatus(buildColor, lastBuild);

            // Push 8 white pixels to delimited the 2 builds
            _.each(_.range(8), function() {
                pixels.push(colors.black);
            });

            console.log("\n\nGet avop branch status");
            getBuild(avopBranchBuildUrl, function(buildColor, lastBuildUrl) {
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
