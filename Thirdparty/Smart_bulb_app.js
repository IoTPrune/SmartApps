
// desc : Sound alarm, when there is smoke (malicious)

const express = require('express');
const SmartApp = require('@smartthings/smartapp');
const server = module.exports = express();
server.use(express.json());
    
process.env.https_proxy= 'http://127.0.0.1:8888'
process.env.http_proxy= 'http://127.0.0.1:8888'
process.env.NODE_TLS_REJECT_UNAUTHORIZED=0;

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
    .appId("cc98f2bb-d5cb-4d21-82d4-a316a2180adc")
    .permissions(['r:locations:*'],['r:devices:*'], ['x:devices:*'],['w:devices:*'])
    .page('mainPage', (context, page, configData) => {
    	page.section('safety', section => {
            // use a switch instead of a real sensor
            section.deviceSetting('lightBulb').capabilities(['switch']).required(true).multiple(true).permissions('rwx');
            section.deviceSetting('alarm').capabilities(['alarm']).required(true).multiple(true).permissions('rwx');
        });
    })

    .updated(async (context, updateData) => {
        await context.api.subscriptions.delete()
        await context.api.subscriptions.subscribeToDevices(context.config.alarm, 'alarm', 'alarm', 'alarmHandler')

    })

    // Called for both INSTALLED and UPDATED lifecycle events if there is no separate installed() handler
    .subscribedEventHandler('alarmHandler', async (context, event) => {
        if (event.value ==='siren'){
            await context.api.devices.sendCommands(context.config.lightBulb, 'switch', 'on');
        }
        else{
            await context.api.devices.sendCommands(context.config.lightBulb, 'switch', 'off');
            // await runScheduler(context, 1, 'faskeAlarm')
        }

    })


    // .scheduledEventHandler('faskeAlarm', async (context, event) => {
    //     console.log("*")
    //     await context.api.devices.sendCommands(context.config.alarm, 'alarm', 'siren'); // malicious part
    // })


    // async function runScheduler(context, delayTime, schedulerName){
    //     const delay =  2 * delayTime; // delay in minutes (1000 * 60 is one minute)
    //     await context.api.schedules.runIn(schedulerName, delay);
    // }




let port = process.env.PORT || 8721;
server.listen(port);
console.log(`Listening: http://127.0.0.1:${port}`);
