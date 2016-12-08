var request = require('request');
var AUTH_HEADER = 'Basic ' + process.env.AUTH;
var BASE_URL = 'https://' + process.env.VSTS_DOMAIN + '.visualstudio.com/DefaultCollection/';
var BASE_TEAM_URL = BASE_URL + process.env.VSTS_TEAM + '/';

function getFlattenedPaths(areaPaths, currentObject, currentPath, currentFormattedPath) {
    var formattedPath = (currentFormattedPath ? currentFormattedPath + '\\' : '\\') + currentObject.name;
    var pathName = (currentPath ? currentPath + '/' : '') + currentObject.name;

    areaPaths.push({
        id: formattedPath,
        path: pathName
    });

    if (currentObject.hasChildren) {
        for (var i=0; i < currentObject.children.length; i++) {
            getFlattenedPaths(areaPaths, currentObject.children[i], pathName, formattedPath)
        }
    }
}

exports.getAreaPaths = function(callback) {
    var areaPaths = [];
    request({
        url: BASE_TEAM_URL + '_apis/wit/classificationnodes/areas?$depth=80&api-version=1.0',
        headers: {
            'Authorization': AUTH_HEADER,
            'Content-Type': 'application/json'
        }
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var parsed = JSON.parse(body);
            getFlattenedPaths(areaPaths, parsed);
        } else {
            console.error(body);
        }
        callback(areaPaths);
    });
}

exports.getTeams = function(callback) {
    request({
        url: BASE_URL + '_apis/projects/FailureIsNotAnOption/teams?api-version=1.0',
        headers: {
            'Authorization': AUTH_HEADER,
            'Content-Type': 'application/json'
        }
    }, function (error, response, body) {
        var teams = [];
        if(!error && response.statusCode == 200) {
            var results = JSON.parse(body);
            for(var i=0; i < results.count; i++) {
                teams.push({ name: results.value[i].name, id: results.value[i].id });
            }
        }
		callback(teams);
    });
}


exports.getProjects = function(callback) {
    request({
        url: BASE_URL + '_apis/projects?api-version=1.0',
        headers: {
            'Authorization': AUTH_HEADER,
            'Content-Type': 'application/json'
        }
    }, function (error, response, body) {
        var projects = [];
        if(!error && response.statusCode == 200) {
            var results = JSON.parse(body);
            for(var i=0; i < results.count; i++) {
                projects.push({ name: results.value[i].name, id: results.value[i].id });
            }
        }
		callback(projects);
    });
}

exports.getRepos = function(callback) {
    request({
        url: BASE_TEAM_URL + '_apis/git/repositories?api-version=1.0',
        headers: {
            'Authorization': AUTH_HEADER,
            'Content-Type': 'application/json'
        }
    }, function (error, response, body) {
        var repos = [];
        if(!error && response.statusCode == 200) {
            var results = JSON.parse(body);
            for(var i=0; i < results.count; i++) {
                repos.push({ name: results.value[i].name, id: results.value[i].id });
            }
        }
		callback(repos);
    });
}

exports.create_subscription = function(options, callback, event) {
    var consumerUrl;

    if(event.type === 'git.pullrequest.created') {
        consumerUrl = process.env.SLACK_REDIRECT + 'pullrequest/create?team_id=' + options.team_id;
    } else if (event.type === 'workitem.created'){
        consumerUrl = process.env.SLACK_REDIRECT + 'workitem/create?team_id=' + options.team_id;
    }

    request({
        url: BASE_URL + '_apis/hooks/subscriptions?api-version=1.0',
        headers: {
            'Authorization': AUTH_HEADER,
            'Content-Type': 'application/json'
        },
        method: 'POST',
        json: true,
        body: {
            'publisherId': 'tfs',
            'eventType': event.type,
            'consumerActionId': 'httpRequest',
            'consumerId': 'webHooks',
            'consumerInputs': {
                'url': consumerUrl,
            },
            'publisherInputs': event.inputs
        }
    }, function (error, response, body) {
        if (!error) {
            callback(response.body.id);
        }
    });
}