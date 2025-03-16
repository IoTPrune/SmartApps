
// desc : SmartApp that turns on a switch for selected length of time when motion is sensed, then ignores motion for some time before enabling again.

//Door  App  3003
const express = require('express');
const SmartApp = require('@smartthings/smartapp');
const server = module.exports = express();
server.use(express.json());
    

const app = new SmartApp();

/* Only here for Glitch, so that GET doesn't return an error */
server.get('/', (req, res) => {
  res.send('desc : SmartApp that turns on a switch for selected length of time when motion is sensed, then ignores motion for some time before enabling again.');
});

/* Handles lifecycle events from SmartThings */
server.post('/', async (req, res) => {
    console.log(JSON.stringify(req.body, null, 2));
    app.handleHttpCallback(req, res);
});

app.enableEventLogging(2)      // logs requests and responses as pretty-printed JSON
    .appId("c9af5397-5bb3-4d5e-84c2-235c41762b8b")
    .permissions(['r:locations:*'],['r:devices:*'], ['x:devices:*'],['w:devices:*'])
    .page('mainPage', (context, page, configData) => {
    	page.section('safety', section => {
            section.deviceSetting('presenceSensor').capabilities(['switch']).required(true).multiple(true).permissions('rwx');
            section.deviceSetting('light').capabilities(['switchLevel']).required(true).multiple(true).permissions('rwx');
            section
                .textSetting('startTimeHour')
                .name('after what time should the light be on, hour');
            section
                .textSetting('startTimeMinute')
                .name('after what time should the light be on, minute');
            section
                .textSetting('endTimeHour')
                .name('after what time should the light be off, hour');
            section
                .textSetting('endTimeMinute')
                .name('after what time should the light be off, minutes');
        });
        
    })

    .updated(async (context, updateData) => {
        await context.api.subscriptions.delete()
        await context.api.subscriptions.subscribeToDevices(context.config.presenceSensor, 'switch', 'switch', 'presenceSensorHandler')
        const userInputs = extractUserInput(context)
        let startTime = `${userInputs.startTimeMinute} ${userInputs.startTimeHour} * * ?`;
        let endTime = `${userInputs.endTimeMinute} ${userInputs.endTimeHour} * * ?`;
        await context.api.schedules.schedule('turnOnLight', startTime);
        await context.api.schedules.schedule('turnOffLight', endTime);
    })

    // Called for both INSTALLED and UPDATED lifecycle events if there is no separate installed() handler
    .subscribedEventHandler('presenceSensorHandler', async (context, event) => {  
        if (event.value === 'on'){
            await SendDeviceCommand(context, 'on')
        }
        else {
            await SendDeviceCommand(context, 'off')
        }
    })

    .scheduledEventHandler('turnOffLight', async (context, event) => {
        await SendDeviceCommand(context, 'off')
    })

    .scheduledEventHandler('turnOnLight', async (context, event) => {
        await SendDeviceCommand(context, 'on')
    })

    function extractUserInput(context){
        const config = context.config;
        const startTimeMinute = configsNumberValue(config, 'startTimeMinute');
        const startTimeHour = configsNumberValue(config, 'startTimeHour');
        const endTimeMinute = configsNumberValue(config, 'endTimeMinute');
        const endTimeHour = configsNumberValue(config, 'endTimeHour');
        return {
            "startTimeMinute": startTimeMinute,
            "startTimeHour": startTimeHour,
            "endTimeMinute": endTimeMinute,
            "endTimeHour": endTimeHour

        }
    }


    async function SendDeviceCommand(context, commandValue){
        await context.api.devices.sendCommands(context.config.light, 'switch', commandValue);
    }



    function configsNumberValue(config, name) {
        return parseInt(config[name]?.[0]?.stringConfig?.value);
    }

    // async function runScheduler(context, delayTime, schedulerName){
    //     const delay = 60 * delayTime; // delay in minutes (1000 * 60 is one minute)
    //     await context.api.schedules.runIn(schedulerName, delay);
    // }

    

    
let port = process.env.PORT || 8725;
server.listen(port);
console.log(`Listening: http://127.0.0.1:${port}`);
