'use strict';

// =================================================================================
// App Configuration
// =================================================================================

const app = require('jovo-framework').Jovo;
const webhook = require('jovo-framework').Webhook;
const Pokedex = require('pokedex-promise-v2');
const PokeImages = require('pokemon-images')

// Listen for post requests (Web hook)
/* webhook.listen(3000, function () {
    console.log('Local development server listening on port 3000.');
});

webhook.post('/webhook', function (req, res) {
    app.handleRequest(req, res, handlers);
    app.execute();
}); */

// Listen for post requests (Lambda)
exports.handler = function(event, context, callback) {
    app.handleRequest(event, callback, handlers);
    app.execute();
    context.callbackWaitsForEmptyEventLoop = false;
};


// =================================================================================
// App Logic
// =================================================================================

const repromptMessage = 'Ask me which number of pokemon you want to know about';
const errorMessage = 'There was an error with your request, please try again';
const goodbyeMessage = 'Thank you for using my pokedex! Remember to catch them all!';

const handlers = {

    'LAUNCH': function () {
        var welcome = 'Welcome to my pokedex. ' + repromptMessage;
        app.ask(welcome, repromptMessage);
    },

    'PokedexIntent': function (number) {
        var P = new Pokedex();
        P.getPokemonByName(number) // with Promise
            .then(function (response) {
                try {
                    //Save the pokemon number to a session variable
                    app.setSessionAttribute('pokemonNo', number);
                    var reprompt = 'Do you want to hear ' + response.name + "'s description?";

                    if (number == 25) {
                        var speech = app.speechBuilder()
                            .addText('The pokemon at ' + number + ' is ')
                            .addAudio('https://s3.us-east-2.amazonaws.com/diego-bst-generalbucket/pikachu.mp3', 'Pikachu')
                            .addText(reprompt);

                        app.followUpState('DescriptionState').ask(speech, reprompt);
                    }
                    else {
                        app.followUpState('DescriptionState').ask('The pokemon at ' + number + ' is ' + response.name + '. ' + reprompt, reprompt);
                    }
                } catch (error) {
                    console.log(error);
                }
            })
            .catch(function (error) {
                console.log(error);
                if (error.statusCode && error.statusCode == 404) {
                    app.ask("I couldn't find the pokemon you asked about, please try again", repromptMessage);
                }
                else {
                    app.ask(errorMessage, repromptMessage);
                }
            });
    },

    'DescriptionState': {

        'YesIntent': function () {
            var P = new Pokedex();
            var number = app.getSessionAttribute('pokemonNo');
            P.getPokemonSpeciesByName(number) // with Promise
                .then(function (response) {
                    var dexEntry = response.flavor_text_entries.filter(function (entry) {
                        return (entry.language.name === 'en');
                    });
                    var description = dexEntry[getRandomInt(0, dexEntry.length - 1)].flavor_text;
                    var img = PokeImages.getSprite(response.name);
                    app.showImageCard(response.name, description, img).tell(response.name + ': ' + description + '. ' + goodbyeMessage);
                })
                .catch(function (error) {
                    console.log(error);
                    app.tell(errorMessage);
                });
        },

        'NoIntent': function () {
            app.tell(goodbyeMessage);
        },

    },

    'YesIntent': function () {
        app.ask(repromptMessage, repromptMessage);
    },

    'NoIntent': function () {
        app.tell(goodbyeMessage);
    },

};

/* Returns a random integer between min (inclusive) and max (inclusive)
 * Using Math.round() will give you a non-uniform distribution!*/
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
