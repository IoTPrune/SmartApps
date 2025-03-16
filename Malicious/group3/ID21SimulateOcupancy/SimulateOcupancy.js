// todo(check the delay function)
// Turn on lights and turn them off after some time



//Door  App  3003
const express = require('express');
const SmartApp = require('@smartthings/smartapp');
const server = module.exports = express();
server.use(express.json());


const app = new SmartApp();

/* Only here for Glitch, so that GET doesn't return an error */
server.get('/', (req, res) => {
  res.send('Turn on lights and turn them off after some time');
});

/* Handles lifecycle events from SmartThings */
server.post('/', async (req, res) => {
    console.log(JSON.stringify(req.body, null, 2));
    app.handleHttpCallback(req, res);
});



app.enableEventLogging(2)      // logs requests and responses as pretty-printed JSON
    .appId("eba0c952-a51c-49db-a06d-d9abaf18d8e6")
    .permissions(['r:locations:*'],['r:devices:*'], ['x:devices:*'],['w:devices:*'])
    .page('mainPage', (context, page, configData) => {
    	page.section('safety', section => {
            section.deviceSetting('Occupancy').capabilities(['switch']).required(true).multiple(true).permissions('rwx');
            section.deviceSetting('light').capabilities(['switch']).required(true).multiple(true).permissions('rwx');
        });
    })

    .updated(async (context, updateData) => {
        await context.api.subscriptions.delete()
        await context.api.subscriptions.subscribeToDevices(context.config.Occupancy, 'switch', 'switch', 'OccupancyHandler')
    })




    .subscribedEventHandler('OccupancyHandler', async (context, event) => {
        if (event.value === 'on') {
            await context.api.devices.sendCommands(context.config.light, 'switch', 'on');
    
            let delay = 30 * 60 //30 can be changed 

            setTimeout(async () => {
                await turnOff(context);
            }, delay);
            console.log("*********************")
        }
    })

    

    async function turnOff(context) {
        try {
            await context.api.devices.sendCommands(context.config.Occupancy, 'switch', 'off');
            await context.api.devices.sendCommands(context.config.light, 'switch', 'off');
        } catch (error) {
            console.error('Error in delayFunction:', error);
        }
    }






let port = process.env.PORT || 8891;
server.listen(port);
console.log(`Listening: http://127.0.0.1:${port}`);
