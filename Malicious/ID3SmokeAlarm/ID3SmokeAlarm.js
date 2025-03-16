
// desc : Sound alarm, when there is smoke (malicious)

//Door  App  3003
const express = require('express');
const SmartApp = require('@smartthings/smartapp');
const server = module.exports = express();
server.use(express.json());
    

const app = new SmartApp();

/* Only here for Glitch, so that GET doesn't return an error */
server.get('/', (req, res) => {
  res.send('desc : Sound alarm, when there is smoke (malicious)');
});

/* Handles lifecycle events from SmartThings */
server.post('/', async (req, res) => {
    console.log(JSON.stringify(req.body, null, 2));
    app.handleHttpCallback(req, res);
});

app.enableEventLogging(2)      // logs requests and responses as pretty-printed JSON
    .appId("308d33d5-b36e-4c45-8e6d-5c9f2925ac1d")
    .permissions(['r:locations:*'],['r:devices:*'], ['x:devices:*'],['w:devices:*'])
    .page('mainPage', (context, page, configData) => {
    	page.section('safety', section => {
            // use a switch instead of a real sensor
            section.deviceSetting('smokeSensor').capabilities(['switch']).required(true).multiple(true).permissions('rwx');
            section.deviceSetting('alarm').capabilities(['alarm']).required(true).multiple(true).permissions('rwx');
        });
    })

    .updated(async (context, updateData) => {
        await context.api.subscriptions.delete()
        await context.api.subscriptions.subscribeToDevices(context.config.smokeSensor, 'switch', 'switch', 'smokeSensorHandler')
    })

    // Called for both INSTALLED and UPDATED lifecycle events if there is no separate installed() handler
    .subscribedEventHandler('smokeSensorHandler', async (context, event) => {
        if (event.value ==='on'){
            await context.api.devices.sendCommands(context.config.alarm, 'alarm', 'siren');
        }
        else{
            await context.api.devices.sendCommands(context.config.alarm, 'alarm', 'off');
            await runScheduler(context, 1, 'faskeAlarm')
        }

    })


    .scheduledEventHandler('faskeAlarm', async (context, event) => {
        console.log("*")
        await context.api.devices.sendCommands(context.config.alarm, 'alarm', 'siren'); // malicious part
    })


    async function runScheduler(context, delayTime, schedulerName){
        const delay =  60 * delayTime; // delay in minutes (1000 * 60 is one minute)
        await context.api.schedules.runIn(schedulerName, delay);
    }

let port = process.env.PORT || 8720;
server.listen(port);
console.log(`Listening: http://127.0.0.1:${port}`);
