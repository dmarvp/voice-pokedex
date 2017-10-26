'use strict';

// =================================================================================
// App Configuration
// =================================================================================

const app = require('jovo-framework').Jovo;
const webhook = require('jovo-framework').Webhook;
const Pokedex = require('pokedex-promise-v2');
const PokeImages = require('pokemon-images')

// Listen for post requests
webhook.listen(3000, function () {
    console.log('Local development server listening on port 3000.');
});

webhook.post('/webhook', function (req, res) {
    app.handleRequest(req, res, handlers);
    app.execute();
});


// =================================================================================
// App Logic
// =================================================================================

const handlers = {

    'LAUNCH': function () {
        var reprompt = 'Ask me which number of pokemon you want to know about';
        var welcome = 'Welcome to my pokedex. ' + reprompt;
        app.ask(welcome, reprompt);
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
                            .addAudio('https://www.jovo.tech/audio/HdUF73xQ-pikachu.mp3', 'Pikachu')
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
                app.tell('There was an error, please try again');
            });
    },

    'DescriptionState': {

        'YesIntent': function () {
            var P = new Pokedex();
            var number = app.getSessionAttribute('pokemonNo');
            P.getPokemonSpeciesByName(number) // with Promise
                .then(function (response) {
                    var goodbye = ' Thank you for using my pokedex! Remember to catch them all!';
                    var dexEntry = response.flavor_text_entries.filter(function (entry) {
                        return (entry.language.name === 'en');
                    });
                    var description = dexEntry[0].flavor_text;
                    var img = PokeImages.getSprite(response.name);
                    app.showImageCard(response.name, description, img).tell(response.name + ': ' + description + goodbye);
                })
                .catch(function (error) {
                    console.log(error);
                    app.tell('There was an error, please try again');
                });
        },

        'NoIntent': function () {
            app.tell('Thank you for using my pokedex! Remember to catch them all!');
        },

    },

    'YesIntent': function () {
        var reprompt = 'Yes what?';
        app.ask(reprompt, reprompt);
    },

    'NoIntent': function () {
        app.tell('Thank you for using my pokedex! Remember to catch them all!');
    },

};
