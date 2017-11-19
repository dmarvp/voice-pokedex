const virtualAlexa = require("virtual-alexa");
const alexa = virtualAlexa.VirtualAlexa.Builder()
    .handler("index.handler") // Lambda function file and name
    .interactionModelFile("speechAssets/interactionModel.json")
    .create();

describe("Voice Pokedex Tests", () => {

    var originalTimeout;

    beforeEach(function () {
        originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
    });

    afterEach(function () {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    });

    test("Launches and asks for voltorb, then cancels  ", (done) => {
        alexa.launch().then((payload) => {
            expect(payload.response.outputSpeech.ssml).toContain("Which number of pokemon would you like to know about");
            return alexa.utter("100");
        }).then((payload) => {
            expect(payload.response.outputSpeech.ssml).toContain("voltorb");
            return alexa.utter("no");
        }).then((payload) => {
            expect(payload.response.outputSpeech.ssml).toContain("Thank you");
            expect(payload.response.shouldEndSession).toBe(true);
            done();
        });
    });

    test("Launches and asks for charizard, then asks for the description  ", (done) => {
        alexa.launch().then((payload) => {
            expect(payload.response.outputSpeech.ssml).toContain("Which number of pokemon would you like to know about");
            return alexa.utter("6");
        }).then((payload) => {
            expect(payload.response.outputSpeech.ssml).toContain("charizard");
            return alexa.utter("ok");
        }).then((payload) => {
            expect(payload.response.outputSpeech.ssml).toContain("charizard");
            expect(payload.response.outputSpeech.ssml).toContain("Would you like to ask for another pokemon");
            expect(payload.response.shouldEndSession).toBe(false);
            done();
        });
    });
});