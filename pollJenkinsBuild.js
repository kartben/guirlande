var request = require('request');

var avopTrunkBuildUrl = "https://jenkins.anyware/platform-new/job/avop-trunk/api/json";
var credentials = {
    "user" : "CHANGEME",
    "password" : "CHANGEME"
};

/**
 * Get the latest build of avop-trunk
 * 
 * @param  {String}   buildUrl jenkins build url to monitor
 * @param  {Function} callback called with the last build object
 * 
 */
var getAvopTrunkBuild = function(buildUrl, callback) {
    request({
            url : buildUrl,
            auth : credentials,
            strictSSL : false
        },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var avopTrunkBuild = JSON.parse(body);
                var buildColor = avopTrunkBuild.color;
                var lastBuildUrl = avopTrunkBuild.lastBuild.url;

                console.log("Color : ", buildColor);
                console.log("Last build : ", lastBuildUrl);
                callback(lastBuildUrl);
            }
    });
};

/**
 * Extract the necessary info to let the magin happen on the LED strip :)
 * 
 * @param  {String} lastBuildUrl
 */
var getLastBuildStatus = function(lastBuildUrl, callback) {
    request({
            url : lastBuildUrl + "/api/json",
            auth : credentials,
            strictSSL : false
        },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var lastBuild = JSON.parse(body);

                console.log("Last build ", lastBuild);
                if(callback) {
                    callback(lastBuild);
                }
            }
    });
};

// Go go go !
getAvopTrunkBuild(avopTrunkBuildUrl, function(lastBuildUrl) {
    getLastBuildStatus(lastBuildUrl, function(lastBuild) {
        // Extract the necessary info and call the guirlande API.
    });
});