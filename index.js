// This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
const Alexa = require('ask-sdk-core');
const GoogleSpreadsheet = require('google-spreadsheet');
const { promisify } = require('util');

const creds = require('./client_secret.json');

// globar variables
let creationSteps = ['create', 'category', 'duration', 'ingredients', 'steps', 'end'];
let currentStep = 0;
let recipe;

async function accessSpreadsheet(action, row) {
    const doc = new GoogleSpreadsheet('1Zi-OsKQ_75nhslIAspg9Ti9kWUFnum-T0kDOQWmHYIw');
    await promisify(doc.useServiceAccountAuth)(creds);
    const info = await promisify(doc.getInfo)();
    const sheet = info.worksheets[0];
    
    const rows = await promisify(sheet.getRows)({
        offset: 1
    });

    if (action === "add"){
        await promisify(sheet.addRow)(row);
    }

}

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'Bienvenidx a Chefcito! ¿Deseas buscar una receta o agregar una nueva?'
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CreateIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'CreateIntent';
    },
    handle(handlerInput) {
        const slots = handlerInput.requestEnvelope.request.intent.slots;
        const recipeName = slots['recipeName'].value;
        let speakOutput;
        
        recipe = {
            name: '',
            steps: [],
            duration: '',
            ingredients: '',
            category: ''
        };
        
        if (recipeName) {
            speakOutput = `El nombre de la receta a crear es ${recipeName}. ¿Qué categoria es?`;
            recipe['name'] = recipeName;
            currentStep += 1;
        } else {
            speakOutput = '¿Cuál sería el nombre de la receta?';
        }
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('¿Desea terminar o seguir con la receta?')
            .getResponse();
    }
};

const CreateCategoryIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'CreateCategoryIntent';
    },
    handle(handlerInput) {
        const slots = handlerInput.requestEnvelope.request.intent.slots;
        const category = slots['category'].value;
        let speakOutput = 'Mencione la categoria';
        
        if (category) {
            recipe['category'] = category;
            speakOutput = '¿Cuál es el tiempo de duración?';
            currentStep += 1;
        }
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('¿Seguimos con los ingredientes o desea terminar?')
            .getResponse();
    }
}

const CreateDurationIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'CreateDurationIntent';
    },
    handle(handlerInput) {
        const slots = handlerInput.requestEnvelope.request.intent.slots;
        const duration = slots['duration'].value;
        let speakOutput = 'Mencione el tiempo que va a tomar';
        
        if (duration) {
            recipe['duration'] = duration;
            speakOutput = '¿Cuáles son los ingredientes?';
            currentStep += 1;
        }
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('¿Seguimos con los ingredientes o desea terminar?')
            .getResponse();
    }
}

const CreateIngredientsIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'CreateIngredientsIntent';
    },
    handle(handlerInput) {
        const slots = handlerInput.requestEnvelope.request.intent.slots;
        const ingredients = slots['ingredients'].value;
        let speakOutput;
        
        recipe['ingredients'] = ingredients
        speakOutput = '¿Cuales son los pasos?';
        currentStep += 1;
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('¿Desea continuar la receta o terminar?')
            .getResponse();
    }
}

const CreateStepIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'CreateStepIntent';
    },
    handle(handlerInput) {
        const slots = handlerInput.requestEnvelope.request.intent.slots;
        const step = slots['step'].value;
        
        let speakOutput;
        
        if (step) {
            recipe['steps'].push(step);
            speakOutput = 'Mencione el siguiente paso o receta terminada';
        } else {
            speakOutput = 'Mencione el primer paso';
        }
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('Entonces?')
            .getResponse();
    }
}

const CreateEndIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'CreateEndIntent';
    },
    async handle(handlerInput) {
        await accessSpreadsheet("add", recipe);
        const speakOutput = `La receta ${recipe['name']} ha sido agregada a sus recetas. ¿Desea hacer algo más?`;
        
        
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
}

const NavIntentHandler = {
   canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'NavIntent';
    },
    handle(handlerInput) {
        const slots = handlerInput.requestEnvelope.request.intent.slots;
        const variable = slots['variable'].value;
        let speakOutput;
        
        const step = creationSteps[currentStep];
        
        if (variable) {
            switch(step) {
                case 'create':
                    speakOutput = `El nombre de la receta a crear es ${variable}. ¿Qué categoria es?`;
                    recipe['name'] = variable;
                    currentStep += 1;
                    break;
                case 'category':
                    recipe['category'] = variable;
                    speakOutput = '¿Cuál es el tiempo de duración?';
                    currentStep += 1;
                    break;
                case 'duration':
                    recipe['duration'] = variable;
                    speakOutput = '¿Cuáles son los ingredientes?';
                    currentStep += 1;
                    break;
                case 'ingredients':
                    recipe['ingredients'] = variable
                    speakOutput = '¿Cuáles son los pasos?';
                    currentStep += 1;
                    break;
                case 'steps':
                    recipe['steps'].push(step);
                    speakOutput = 'Mencione el siguiente paso o receta terminada';
                    break;
                case 'end':
                    speakOutput = '¿Deseas buscar una receta o agregar una nueva?';
                    currentStep = 0;
                default:
                    speakOutput = 'defawl';
            }
        } else {
            speakOutput = '¿Deseas buscar una receta o agregar una nueva?';
            currentStep = 0;
        }
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt()
            .getResponse();
    } 
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = '¿En que ayudo?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Adios';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.stack}`);
        const speakOutput = `Sorry, I had trouble doing what you asked. Please try again.`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        CreateIntentHandler,
        CreateCategoryIntentHandler,
        CreateDurationIntentHandler,
        CreateIngredientsIntentHandler,
        CreateStepIntentHandler,
        CreateEndIntentHandler,
        NavIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    )
    .addErrorHandlers(
        ErrorHandler,
    )
    .lambda();
