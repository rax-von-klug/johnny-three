var slack = require('../controllers/botkit');

module.exports = function(app) {
    app.post('/workitem/create', function(req, res) {
        var teamId = req.query.team_id;
        var workItem = req.body;

        slack.controller.storage.teams.get(teamId, function(err, team) {
            if(!err && team.subscriptions) {
                for (var i=0; i < team.subscriptions.length; i++) {
                    if(team.subscriptions[i].areaPath == workItem.resource.fields['System.AreaPath']) {
                        var message = '*Work item created: #' + workItem.resource.id + ':* ' + workItem.resource.fields['System.Title'];
                        var bot = slack.getExistingBot(team.bot.token);
                        
                        bot.say({
                            text: message,
                            channel: team.subscriptions[i].channel
                        });
                    }
                }
                res.sendStatus(200);
            } else {
                res.sendStatus(500);
            }
        });
    });

    app.post('/pullrequest/create', function(req, res) {
        var teamId = req.query.team_id;
        var pullRequest = req.body;

        slack.controller.storage.teams.get(teamId, function(err, team) {
            if(!err && team.subscriptions) {
                for (var i=0; i < team.subscriptions.length; i++) {
                    if(team.subscriptions[i].repositoryId == pullRequest.resource.repository.id) {
                        var pull_request_url = pullRequest.resource.repository.remoteUrl + "/pullrequest/" + pullRequest.resource.pullRequestId;
                        var attachment = [
                            {
                                "mrkdwn_in": ["text", "pretext", "fields"],
                                "fallback": "Pull Request #" + pullRequest.resource.pullRequestId + " created by " + pullRequest.resource.createdBy.displayName,
                                "color": "#36a64f",
                                "pretext": "<" + pull_request_url + "|Pull Request #" + pullRequest.resource.pullRequestId + "> created by " + pullRequest.resource.createdBy.displayName,
                                "author_name": pullRequest.resource.repository.name,
                                "author_link": pullRequest.resource.repository.remoteUrl,
                                "title": pullRequest.resource.title,
                                "text": pullRequest.resource.description,
                                "fields": [
                                    {
                                        "title": "",
                                        "value": "",
                                        "short": false
                                    },
                                    {
                                        "title": "Branches",
                                        "value": "`" + pullRequest.resource.sourceRefName + "` into `" + pullRequest.resource.targetRefName + "`",
                                        "short": false
                                    }
                                ],
                                "footer": "Visual Studio Team Services API",
                                "footer_icon": process.env.SLACK_REDIRECT + "img/vsts.png"
                            }
                        ];
                        var bot = slack.getExistingBot(team.bot.token);
                        
                        bot.say({
                            attachments: attachment,
                            channel: team.subscriptions[i].channel
                        });
                    }
                }
                res.sendStatus(200);
            } else {
                res.sendStatus(500);
            }
        });
    });
}