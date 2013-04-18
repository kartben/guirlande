var request = require('request');

var avopTrunkBuildUrl = "https://jenkins.anyware/platform-new/job/avop-trunk/api/json";
var avopBranchBuildUrl = "https://jenkins.anyware/platform-new/job/avop-13.2.x/api/json";
var credentials = {
    "user" : "changeme",
    "password" : "changeme"
};

/**
 * Get the latest build of avop-trunk
 * 
 * @param  {String}   buildUrl jenkins build url to monitor
 * @param  {Function} callback called with the last build object
 * 
 */
var getBuild = function(buildUrl, callback) {
    request({
            url : buildUrl,
            auth : credentials,
            strictSSL : false
        },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var build = JSON.parse(body);
                var buildColor = build.color;
                var lastBuildUrl = build.lastBuild.url;

                // console.log("Color : ", buildColor);
                // console.log("Last build : ", lastBuildUrl);
                callback(buildColor, lastBuildUrl);
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

                // console.log("Last build ", lastBuild);
                if(callback) {
                    callback(lastBuild);
                }
            }
    });
};

// Go go go !
console.log("Get avop trunk status");
getBuild(avopTrunkBuildUrl, function(buildColor, lastBuildUrl) {
    getLastBuildStatus(lastBuildUrl, function(lastBuild) {
        // Extract the necessary info and call the guirlande API.
        console.log("push 24 ", buildColor, " pixels");

        console.log("Get avop branch status");
        getBuild(avopBranchBuildUrl, function(buildColor, lastBuildUrl) {
            getLastBuildStatus(lastBuildUrl, function(lastBuild) {
                // Extract the necessary info and call the guirlande API.
                console.log("push 24 ", buildColor, " pixels");
            });
        });


    });
});