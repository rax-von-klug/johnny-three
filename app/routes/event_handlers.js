var slack = require('../controllers/botkit');

module.exports = function(app) {
    app.post('/workitem/create', function(req, res) {
        var teamId = req.query.team_id;
        var workItem = req.body;

        slack.controller.storage.teams.get(teamId, function(err, team) {
            if(!err && team.subscriptions) {
                for (var i=0; i < team.subscriptions.length; i++) {
                    if(team.subscriptions[i].id == workItem.id) {
                        var message = 'Work item created: #' + workItem.resource.id + ': ' + workItem.resource.fields['System.Title'];
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
}