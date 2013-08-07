/*******************************************************************************
 * Copyright (c) 2013 Sébastien Moran and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     Sébastien Moran - initial API and implementation
 *******************************************************************************/
var async = require('async');
var request = require('request');
var _ = require('underscore');
var nconf = require('nconf');
var fs = require('fs');
var clc = require('cli-color');

if (!fs.existsSync('./config.json')) {
    console.error('Your forgot to create your config.json configuration file.');
    console.log('You can use config.json.template.');
    return;
}

// Load the config.json configuration file
// You can use the config.json.template to create yours
nconf.use('file', { file: './config.json' });

nconf.defaults({
    'pollingPeriod' : 30000
});

nconf.load();

var blocks = nconf.get('blocks');
var m3daServerUrl = nconf.get('m3daServerUrl');
var DEVICE_ID = nconf.get('deviceId');
var POLLING_PERIOD = nconf.get('pollingPeriod');

var configError = false;
if (!blocks) {
    console.error('## Config errror : "blocks" value not set.');
    configError = true;
}

if (!m3daServerUrl) {
    console.error('## Config errror : "m3daServerUrl" value not set.');
    configError = true;
}

if (!DEVICE_ID) {
    console.error('## Config errror : "deviceId" value not set.');
    configError = true;
}

if (configError) {
    console.error('## Please check the your config.json file.');
    return;
}

var guirlandeUri = '/m3da/data/' + DEVICE_ID;


// Define the default colors
// TODO : change format and move them to the config.json.template
var colors = {
    grey : { red : 100, green : 100, blue : 100 },
    aborted : { red : 100, green : 100, blue : 100 },
    disabled : { red : 173, green : 184, blue : 186 },
    yellow : { red : 168, green : 153, blue : 40 },
    blue : { red : 13, green : 13, blue : 163 },
    red : { red : 201, green : 18, blue : 18 },
    white : {  red : 100, green : 100, blue : 100 },
    green : {  red : 6, green : 117, blue : 15 },
    black : {  red : 0 , green : 0, blue: 0}
};

// Extend the default colors to define the same colors in blinking state
colors = _.extend(colors, {
    aborted_anime : _.extend(_.clone(colors.aborted), { blink : true}),
    disabled_anime : _.extend(_.clone(colors.disabled), { blink : true}),
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
var getBuild = function(build, callback) {
    console.log('\n\nGet status of >> ', build.url);
    request({
            url : build.url,
            strictSSL : false
        },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var remoteBuild = JSON.parse(body);
                callback(remoteBuild.color, remoteBuild.lastBuild.url);
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
            url : lastBuildUrl + '/api/json',
            strictSSL : false
        },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var lastBuild = JSON.parse(body);

                // console.log('Last build ', lastBuild);
                if(callback) {
                    callback(lastBuild);
                }
            }
    });
};

/**
 * Process the build status to update the guirlande
 *
 * @param  {Object} block, block config object
 * @param  {String} color, corresponds to the status.
 * @param  {Object} buildStatus, see Jenkins API for more details
 */
var processBuildStatus = function(block, color, buildStatus) {
    console.log(' Process build >> ', buildStatus.fullDisplayName);
    console.log('', buildStatus.result, '=> push', block.nbLeds, color, 'pixels');
    _.each(_.range(block.nbLeds), function(){
        pixels.push(colors[color]);
    });

    if (block.claimStatus) {
        // Look for claiming information
        var claimedStatus = _.find(buildStatus.actions, function(action) {
            return action.claimed;
        });

        // Does anyone has claimed this build ?
        var claimColor = colors.black;
        if (claimedStatus) {
            console.log(' Claimed => push',block.claimStatus,'green');
            claimColor = colors.green;
        } else {
            console.log(' Not claimed => push',block.claimStatus,'black');
        }

        _.each(_.range(block.claimStatus), function(){
            pixels.push(claimColor);
        });
    }
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
            key : 'leds.writePixels',
            value : pixels
        }]
    };

    console.log('\n >>> Send pixels !');
    // console.log('pixels :: ', pixels);
    // printPixels(pixels);

    request({
        url : m3daServerUrl + guirlandeUri,
        method : 'POST',
        body : JSON.stringify(command)
    },
    function(error, response, body) {
        if(error) {
            console.log(' <<<< Oops something went wrong ...');
            console.log(body);
        } else {
            console.log(' <<<< Pixels updated !');
        }
        console.log(' ### Next check in ', POLLING_PERIOD / 1000, 'seconds');
    });
};

/**
 * Print an ASCII preview of the remote guirlande :)
 * 
 * @param  {Object} pixels sent to the guirlande
 */
var printPixels = function(pixels) {
    var guirlande = _.map(pixels, function(pixel){
        // Handle the "aborted" color => use grey
        var color = pixel.name === 'aborted' ? 'grey' : pixel.name;
        // Blinking pixels are represented by "@" normal ones by "#"
        var text = pixel.blink ? '@' : '#';
        // Use cli-color to emulate the LED colors
        return clc[color](text);
    }).join(" ");

    console.log('\nIt should look like this:\n');
    console.log(guirlande);
    console.log('\n    Caption : @ > Blinking, # > Normal\n');
};

var processBlocks = function() {
    console.log('\n -- Ctrl-C to stop harassing Jenkins');
    // Clean the possible last array of pixels
    pixels = [];

    stillChecking = true;
    async.eachSeries(blocks, function(block, callback) {
        // Is this block a separator or a jenkins build
        if (block.url) {
            getBuild(block, function(buildColor, lastBuildUrl) {
                getLastBuildStatus(lastBuildUrl, function(lastBuild) {
                    console.log('Last build >> ', lastBuild.fullDisplayName);
                    // Extract the necessary info and call the guirlande API.
                    processBuildStatus(block, buildColor, lastBuild);

                    callback();
                });
            });
        } else {
            // It must be a separator, just push black pixels
            _.each(_.range(block.nbLeds), function(){
                pixels.push(colors.black);

                console.log('Space => push 1 black');
            });
            callback();
        }

    }, function() {
        // Finally send the command to update the guirlande
        sendPixels(pixels);

        // Wait sometime before checking again
        setTimeout(function(){
            processBlocks();
        }, POLLING_PERIOD);
    });
};

// Go go go !
console.log('############################################');
console.log('      Let\'s go !');
console.log('############################################');

processBlocks();
