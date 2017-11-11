const virtualAlexa = require("virtual-alexa");
const alexa = virtualAlexa.VirtualAlexa.Builder()
    .handler("index.handler") // Lambda function file and name
    .interactionModelFile("speechAssets/interactionModel.json")
    .create();

describe("My Pokedex Tests", () => {

    test("Launches and asks for voltorb, then cancels  ", () => {
        alexa.launch().then((payload) => {
            expect(payload.response.outputSpeech.ssml).toContain("Ask me which number of pokemon you want to know about");
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

    test("Launches and asks for charizard, then asks for the description  ", () => {
        alexa.launch().then((payload) => {
            expect(payload.response.outputSpeech.ssml).toContain("Ask me which number of pokemon you want to know about");
            return alexa.utter("6");

        }).then((payload) => {
            expect(payload.response.outputSpeech.ssml).toContain("charizard");
            return alexa.utter("ok");
        }).then((payload) => {
            expect(payload.response.outputSpeech.ssml).toContain("charizard");
            expect(payload.response.outputSpeech.ssml).toContain("Thank you");
            expect(payload.response.shouldEndSession).toBe(true);
            done() ;  
        });
    });
});