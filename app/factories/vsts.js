var request = require('request');

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
        url: 'https://chrislund.visualstudio.com/DefaultCollection/FailureIsNotAnOption/_apis/wit/classificationnodes/areas?$depth=80&api-version=1.0',
        headers: {
            'Authorization': 'Basic Omh4cjUzNGR0eHliNnk1bWVwc2tkdW9lZGF2YmkzNnloZ3B0Y3VuNWRsZGl2a21waW15MnE=',
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
        url: 'https://chrislund.visualstudio.com/defaultcollection/_apis/projects/FailureIsNotAnOption/teams?api-version=1.0',
        headers: {
            'Authorization': 'Basic Omh4cjUzNGR0eHliNnk1bWVwc2tkdW9lZGF2YmkzNnloZ3B0Y3VuNWRsZGl2a21waW15MnE=',
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
        url: 'https://chrislund.visualstudio.com/defaultcollection/_apis/projects?api-version=1.0',
        headers: {
            'Authorization': 'Basic Omh4cjUzNGR0eHliNnk1bWVwc2tkdW9lZGF2YmkzNnloZ3B0Y3VuNWRsZGl2a21waW15MnE=',
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

exports.create_subscription = function(options, callback) {
    request({
        url: 'https://chrislund.visualstudio.com/defaultcollection/_apis/hooks/subscriptions?api-version=1.0',
        headers: {
            'Authorization': 'Basic Omh4cjUzNGR0eHliNnk1bWVwc2tkdW9lZGF2YmkzNnloZ3B0Y3VuNWRsZGl2a21waW15MnE=',
            'Content-Type': 'application/json'
        },
        method: 'POST',
        json: true,
        body: {
            'publisherId': 'tfs',
            'eventType': 'workitem.created',
            'consumerActionId': 'httpRequest',
            'consumerId': 'webHooks',
            'consumerInputs': {
                'url': process.env.SLACK_REDIRECT + '/workitem/create?team_id=' + options.team_id,
            },
            'publisherInputs': {
                'areaPath': options.area_path,
                'workItemType': '',
                'projectId': '7b8849b0-6d6a-422b-833f-8f962400b781'
            }
        }
    }, function (error, response, body) {
        if (!error) {
            callback(response.body.id);
        }
    });
}