
// desc : This app automatically changes mode from Away to Vacation Mode after it stays in Away mode 

//Door  App  3003
const express = require('express');
const SmartApp = require('@smartthings/smartapp');
const server = module.exports = express();
server.use(express.json());
    

const app = new SmartApp();

/* Only here for Glitch, so that GET doesn't return an error */
server.get('/', (req, res) => {
  res.send('desc : This app automatically changes mode from Away to Vacation Mode after it stays in Away mode ');
});

/* Handles lifecycle events from SmartThings */
server.post('/', async (req, res) => {
    console.log(JSON.stringify(req.body, null, 2));
    app.handleHttpCallback(req, res);
});

let startTime = Date.now();
app.enableEventLogging(2)      // logs requests and responses as pretty-printed JSON
    .appId("5d18d264-24ba-4cf2-b51f-90e961ab1cc4")
    .permissions(['r:locations:*','w:locations:*','x:locations:*','r:devices:*', 'x:devices:*','w:devices:*'])
    .page('mainPage', (context, page, configData) => {
    	page.section('safety', section => {
            section
                .textSetting('timeInterval')
                .name('Change mode to Vacation mode after how much time in Away Mode?');
        });
        
    })

    .updated(async (context, updateData) => {
        await context.api.subscriptions.delete()
        await context.api.subscriptions.subscribeToModeChange();
    })

    // Called for both INSTALLED and UPDATED lifecycle events if there is no separate installed() handler
    .subscribedEventHandler('undefined', async (context, event) => {
        const currentMode = await getCurrentMode(context, event)
        let isCurrentModeAway = checkCurrentMode(currentMode)
        const userTimeInterval = extractUserInput(context)
        await unschedule(context)
        updatestartTime()
        if (isCurrentModeAway){
            await runScheduler(context, userTimeInterval, 'changeMode')
        }
    })

    .scheduledEventHandler('changeMode', async (context, event) => {
        const modeList = await getAllLocationModes(context)
        const toModeId = await getModeId(modeList, "Vacation")
        await updateLocationMode(context, event, toModeId)
    })

    async function unschedule(context){
        await context.api.schedules.unschedule('changeMode');
    }

    function checkCurrentMode(currentMode){
        if (currentMode === "Away"){
            updatestartTime()
            return true
        }
        return false
    }

    function updatestartTime(){
        startTime = Date.now()
    }
    
    function extractUserInput(context){
        const config = context.config;
        const timeInterval = configsNumberValue(config, 'timeInterval');
        return timeInterval
    }


    function configsNumberValue(config, name) {
        return parseInt(config[name]?.[0]?.stringConfig?.value);
    }

    async function runScheduler(context, userTimeInterval, schedulerName){
        const delay = 60 * userTimeInterval; // delay in minutes (1000 * 60 is one minute)
        await context.api.schedules.runIn(schedulerName, delay);
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
    async function getModeId(modeList, toModeName){
        const toModeId = modeList.find(element => element.name === toModeName)?.id;
        return toModeId
    }

    async function updateLocationMode(context, event , toModeId){
        await context.api.modes.setCurrent(toModeId, event.locationId)
    }
    
let port = process.env.PORT || 8711;
server.listen(port);
console.log(`Listening: http://127.0.0.1:${port}`);
