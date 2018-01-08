'use strict';

// =================================================================================
// App Configuration
// =================================================================================

const app = require('jovo-framework').Jovo;
const webhook = require('jovo-framework').Webhook;
const Pokedex = require('pokedex-promise-v2');

//Listen for post requests (Web hook)
// webhook.listen(3000, function () {
//     console.log('Local development server listening on port 3000.');
// });

// webhook.post('/webhook', function (req, res) {
//     app.handleRequest(req, res, handlers);
//     app.execute();
// });

// Listen for post requests (Lambda)
exports.handler = function (event, context, callback) {
    app.handleRequest(event, callback, handlers);
    app.execute();
    context.callbackWaitsForEmptyEventLoop = false;
};

// =================================================================================
// App Logic
// =================================================================================

const repromptMessage = "¿Which number of pokemon would you like to know about?";
const errorMessage = "There was an error with your request, please try again";
const goodbyeMessage = "Thank you for using the voice pokedex! Remember to catch them all!";
const followupQuestion = "¿Would you like to ask for another pokemon?";
const helpMessage = "Tell me the number of a pokemon you would like to know about." +
    " Currently, you can ask for pokemons up to the number 802." +
    " If I find the pokemon you are looking for, I'll give you the option to hear one of it's pokedex description as well. " + repromptMessage;
const pikachuAudio = 'https://s3.us-east-2.amazonaws.com/diego-bst-generalbucket/pikachu.mp3';

const handlers = {
    'LAUNCH': function () {
        const welcome = 'Welcome to the voice pokedex. ' + repromptMessage;
        app.ask(welcome, repromptMessage);
    },
    'PokedexIntent': function (number) {
        const P = new Pokedex();
        P.getPokemonByName(number) // with Promise
            .then(function (response) {
                try {
                    //Save the pokemon number to a session variable
                    app.setSessionAttribute('pokemonNo', number);
                    app.setSessionAttribute('pokemonImg', response.sprites.front_default);
                    const description = `The pokemon at ${number} is ${response.name}. `;
                    const reprompt = `Do you want to hear ${response.name}'s description?`;

                    let speech = "";
                    if (number == 25) {
                        speech = app.speechBuilder()
                            .addText(`The pokemon at ${number} is `)
                            .addAudio(pikachuAudio, 'Pikachu')
                            .addText(reprompt);
                    }
                    else {
                        speech = description + reprompt;
                    }
                    app.followUpState('DescriptionState').showImageCard(response.name, description, response.sprites.front_default).ask(speech, reprompt);
                } catch (error) {
                    console.error(error);
                }
            })
            .catch(function (error) {
                console.error(error);
                if (error.statusCode && error.statusCode == 404) {
                    app.ask("I couldn't find the pokemon you asked about, please try again", repromptMessage);
                }
                else {
                    app.ask(errorMessage, repromptMessage);
                }
            });
    },
    'Unhandled': function () {
        app.ask(`For now, I can only take pokemon numbers. Please, tell me ${repromptMessage}`, repromptMessage);
    },
    'DescriptionState': {
        'YesIntent': function () {
            const P = new Pokedex();
            const number = app.getSessionAttribute('pokemonNo');
            const img = app.getSessionAttribute('pokemonImg');

            P.getPokemonSpeciesByName(number) // with Promise
                .then(function (response) {
                    const dexEntry = response.flavor_text_entries.filter(function (entry) {
                        return (entry.language.name === 'en');
                    });
                    const description = dexEntry[getRandomInt(0, dexEntry.length - 1)].flavor_text.replace(/[\x00-\x1F\x7F-\x9F]/g, " ");
                    app.followUpState('ContinueState').showImageCard(response.name, description, img).ask(`${response.name}: ${description} ${followupQuestion}`);
                })
                .catch(function (error) {
                    console.error(error);
                    app.tell(errorMessage);
                });
        },
        'NoIntent': function () {
            app.followUpState('ContinueState').ask(followupQuestion);
        },
        'Unhandled': function () {
            const reprompt = 'Please answer with yes or no.';
            app.ask(reprompt, reprompt);
        }
    },
    'ContinueState': {
        'YesIntent': function () {
            app.followUpState(null).ask(repromptMessage);
        },
        'NoIntent': function () {
            app.tell(goodbyeMessage);
        },
        'Unhandled': function () {
            const reprompt = 'Please answer with yes or no.';
            app.ask(reprompt, reprompt);
        }
    },
    'AMAZON.CancelIntent': function () {
        app.tell(goodbyeMessage);
    },
    'AMAZON.HelpIntent': function () {
        app.ask(helpMessage);
    },
};

/* Returns a random integer between min (inclusive) and max (inclusive)
 * Using Math.round() will give you a non-uniform distribution!*/
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
