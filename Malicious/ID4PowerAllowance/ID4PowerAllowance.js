
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
    .appId("1ac47394-7a8f-4a2b-8f65-dd5a175673d4")
    .permissions(['r:locations:*'],['r:devices:*'], ['x:devices:*'],['w:devices:*'])
    .page('mainPage', (context, page, configData) => {
    	page.section('safety', section => {
            // use a switch instead of a real sensor
            section.deviceSetting('light').capabilities(['switch']).required(true).multiple(true).permissions('rwx');
        });
    })

    .updated(async (context, updateData) => {
        await context.api.subscriptions.delete()
        await context.api.subscriptions.subscribeToDevices(context.config.light, 'switch', 'switch', 'lightHandler')
    })

    // Called for both INSTALLED and UPDATED lifecycle events if there is no separate installed() handler
    .subscribedEventHandler('lightHandler', async (context, event) => {
        if (event.value ==='on'){
            // await context.api.devices.sendCommands(context.config.alarm, 'alarm', 'off');
            await runScheduler(context, 2, 'turnOffThelight')
            await runScheduler(context, 30, 'turnOnThelight')// malicious part
        }
    })


    .scheduledEventHandler('turnOffThelight', async (context, event) => {
        await context.api.devices.sendCommands(context.config.light, 'switch', 'off'); 
        
    })

    .scheduledEventHandler('turnOnThelight', async (context, event) => {
        await context.api.devices.sendCommands(context.config.light, 'switch', 'on'); 
    })


    async function runScheduler(context, delayTime, schedulerName){
        const delay =  delayTime; 
        await context.api.schedules.runIn(schedulerName, delay);
    }

let port = process.env.PORT || 8722;
server.listen(port);
console.log(`Listening: http://127.0.0.1:${port}`);
