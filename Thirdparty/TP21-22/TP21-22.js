
// desc : Changes mode based on the state of a dummy on/off switch

//Door  App  3003
const express = require('express');
const SmartApp = require('@smartthings/smartapp');
const server = module.exports = express();
server.use(express.json());
    

const app = new SmartApp();

/* Only here for Glitch, so that GET doesn't return an error */
server.get('/', (req, res) => {
  res.send('Changes mode based on the state of a dummy on/off switch');
});

/* Handles lifecycle events from SmartThings */
server.post('/', async (req, res) => {
    console.log(JSON.stringify(req.body, null, 2));
    app.handleHttpCallback(req, res);
});


app.enableEventLogging(2)      // logs requests and responses as pretty-printed JSON
    .appId("61ea7772-5f99-4618-9de3-27b49df2f253")
    .permissions(['r:locations:*','w:locations:*','x:locations:*','r:devices:*', 'x:devices:*','w:devices:*'])
    .page('mainPage', (context, page, configData) => {
    	page.section('safety', section => {
            section.deviceSetting('light').capabilities(['switch']).required(true).multiple(true).permissions('rwx');
            section
                .textSetting('inputFromMode')
                .name('what should be the current Mode to change?');
            section
                .textSetting('inputToMode')
                .name('what is the mode you want to change it to?');
        });
        
    })

    .updated(async (context, updateData) => {
        await context.api.subscriptions.delete()
        await context.api.subscriptions.subscribeToDevices(context.config.light, 'switch', 'switch', 'lightHandler')
    })

    // Called for both INSTALLED and UPDATED lifecycle events if there is no separate installed() handler
    .subscribedEventHandler('lightHandler', async (context, event) => {
        const inputModes = extractUserInputs(context)
        const modeList = await getAllLocationModes(context)
        const currentMode = await getCurrentMode(context, event) 
        const toModeId = await getModeId(modeList, inputModes.inputToMode)
        let ModeComparisonFlag = currentModeComparison(currentMode, inputModes.inputFromMode)
        if (ModeComparisonFlag){
            // await context.api.modes.setCurrent(toModeId, event.locationId)
            await updateLocationMode(context, event, toModeId)
        }
    })

    function extractUserInputs(context){
        const config = context.config;
        const inputFromMode = configsStringValue(config, 'inputFromMode');
        const inputToMode = configsStringValue(config, 'inputToMode');
        return {
            "inputFromMode": inputFromMode,
            "inputToMode": inputToMode
        }
    }

    function configsStringValue(config, name) {
        return config[name]?.[0]?.stringConfig?.value;
    }

    async function getAllLocationModes(context){
        const modeList = await context.api.modes.list();
        return modeList
    }

    async function getCurrentMode(context, event){
        const currentMode = await context.api.modes.getCurrent(event.locationId);
        return currentMode.name
    }

    //finds the Id if the current mode and the outputMode
    async function getModeId(modeList, inputToMode){
        const toModeId = modeList.find(element => element.name === inputToMode)?.id;
        return toModeId
    }

    function currentModeComparison(currentMode, inputFromMode){
        return (currentMode === inputFromMode)
    }

    async function updateLocationMode(context, event , toModeId){
        await context.api.modes.setCurrent(toModeId, event.locationId)
    }
    
let port = process.env.PORT || 8710;
server.listen(port);
console.log(`Listening: http://127.0.0.1:${port}`);
