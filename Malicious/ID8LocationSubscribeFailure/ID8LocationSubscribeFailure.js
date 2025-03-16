
// desc :Set mode when you are at home or leave home",



//Door  App  3003
const express = require('express');
const SmartApp = require('@smartthings/smartapp');
const server = module.exports = express();
server.use(express.json());


const app = new SmartApp();

/* Only here for Glitch, so that GET doesn't return an error */
server.get('/', (req, res) => {
  res.send('Set mode when you are at home or leave home",');
});

/* Handles lifecycle events from SmartThings */
server.post('/', async (req, res) => {
    console.log(JSON.stringify(req.body, null, 2));
    app.handleHttpCallback(req, res);
});



app.enableEventLogging(2)      // logs requests and responses as pretty-printed JSON
    .appId("b7b56ccc-25c7-4a3b-a381-e3468f9bec2c")
    .permissions(['r:locations:*','w:locations:*','x:locations:*','r:devices:*', 'x:devices:*','w:devices:*'])
    .page('mainPage', (context, page, configData) => {
    	page.section('safety', section => {
            section.deviceSetting('presenceSensor').capabilities(['switch']).required(true).multiple(true).permissions('rwx');
            section.deviceSetting('doorLock').capabilities(['lock']).required(true).multiple(true).permissions('rwx');
        });
    })

    .updated(async (context, updateData) => {
        await context.api.subscriptions.delete()
        await context.api.subscriptions.subscribeToModeChange()
        await context.api.subscriptions.subscribeToDevices(context.config.presenceSensor, 'switch', 'switch', 'presenceSensorHandler')
    })

    // Called for both INSTALLED and UPDATED lifecycle events if there is no separate installed() handler
    .subscribedEventHandler('presenceSensorHandler', async (context, event) => {
        let homeModeId = '';
        let awayModeId = '';
        const modeList = await context.api.modes.list();
        modeList.forEach(element => {
            if (element.name === 'Home') {
                homeModeId = element.id;
            } else if (element.name === 'Away') {
                    awayModeId = element.id;
            }
        });
        if (event.value=== 'on'){
            await context.api.modes.setCurrent(homeModeId , event.locationId)
        } else {
            await context.api.modes.setCurrent(awayModeId , event.locationId)
        }
        
    })

    .subscribedEventHandler('undefined', async (context, event) => {
        const currentMode = await context.api.modes.getCurrent( event.locationId);
        if (currentMode.name === 'Night'){
            await SendDeviceCommand(context, 'lock')
        } else if (currentMode.name === 'Away'){
            await SendDeviceCommand(context, 'lock')
        } else if (currentMode.name === 'Home'){
            await SendDeviceCommand(context, 'unlock')
        }
        
    })

    async function SendDeviceCommand(context, commandValue){
        await context.api.devices.sendCommands(context.config.doorLock, 'lock', commandValue);
    }




let port = process.env.PORT || 8726;
server.listen(port);
console.log(`Listening: http://127.0.0.1:${port}`);
