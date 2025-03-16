
// desc :"This app turns on a light when motion is detected during a user specified time period. The user can select which days this app is enabled. The user can also set a timeout period for the light. This will cause the light to turn off if the motion sensor has not detected movement in that amount of time."
const express = require('express');
const SmartApp = require('@smartthings/smartapp');
const server = module.exports = express();
server.use(express.json());


const app = new SmartApp();

/* Only here for Glitch, so that GET doesn't return an error */
server.get('/', (req, res) => {
  res.send('"This app turns on a light when motion is detected during a user specified time period. The user can select which days this app is enabled. The user can also set a timeout period for the light. This will cause the light to turn off if the motion sensor has not detected movement in that amount of time."');
});

/* Handles lifecycle events from SmartThings */
server.post('/', async (req, res) => {
    console.log(JSON.stringify(req.body, null, 2));
    app.handleHttpCallback(req, res);
});



app.enableEventLogging(2)      // logs requests and responses as pretty-printed JSON
    .appId("7379bdc2-d5c1-4193-91a0-abda7c4dbb7d")
    .permissions(['r:locations:*'],['r:devices:*'], ['x:devices:*'],['w:devices:*'])
    .page('mainPage', (context, page, configData) => {
    	page.section('safety', section => {
            section.deviceSetting('motionSensor').capabilities(['motionSensor']).required(true).multiple(true).permissions('rwx');
            section.deviceSetting('light').capabilities(['switch']).required(true).multiple(true).permissions('rwx');
        });
        page.section('userInput', section => {
            section
                .textSetting('waitingTime')
                .name('Time to wait before turning off the light if no motion is detected(in minuted)?');
            section
                .textSetting('startTime')
                .name('at what time this app should start working?');
            section
                .textSetting('endTime')
                .name('at what time this app should end working?');
        });
    })

    .updated(async (context, updateData) => {
        await context.api.subscriptions.delete()
        await context.api.subscriptions.subscribeToDevices(context.config.motionSensor, 'motionSensor', 'motion', 'sensorHandler')      
    })


    

    // Called for both INSTALLED and UPDATED lifecycle events if there is no separate installed() handler
    .subscribedEventHandler('sensorHandler', async (context, event) => {
        userInputs = extractAllInputValues(context)
        if (event.value === 'active' && checkTimeWindow(userInputs.startTime , userInputs.endTime)) {
            await context.api.devices.sendCommands(context.config.light, 'switch', 'on');
            const delay =  1000 * userInputs.waitingTime;
            await context.api.schedules.runIn('turnOfLight', delay);
        }
    })

    .scheduledEventHandler('turnOfLight', async (context, event) => {
        await context.api.devices.sendCommands(context.config.light, 'switch', 'off');
    })


    function extractAllInputValues(context){
        const config = context.config;
        const waitingTime = configsStringValue(config, 'waitingTime');
        const startTime = configsStringValue(config, 'startTime');
        const endTime = configsStringValue(config, 'endTime');
        return {
            "waitingTime" : waitingTime,
            "startTime" : startTime,
            "endTime" : endTime
        }
    }

    function configsStringValue(config, name) {
        return parseInt(config[name]?.[0]?.stringConfig?.value);
    }
    

    
    function sleep(ms) {
        return new Promise((resolve) => {
          setTimeout(resolve, ms);
        });
    }
    function checkTimeWindow(startTime, endTime){
        currentHour = getCurrentHour()
            return (currentHour < endTime) &&  (currentHour > startTime)
    }

    function getCurrentHour(){
        return new Date().getHours();
    }

    





let port = process.env.PORT || 8708;
server.listen(port);
console.log(`Listening: http://127.0.0.1:${port}`);
