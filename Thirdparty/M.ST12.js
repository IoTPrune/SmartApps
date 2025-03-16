
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
    .appId("218a3976-0fa8-46d8-97f0-040e2194d610")
    .permissions(['r:locations:*'],['r:devices:*'], ['x:devices:*'],['w:devices:*'])
    .page('mainPage', (context, page, configData) => {
    	page.section('safety', section => {
            // use a switch instead of a real sensor
            section.deviceSetting('heater').capabilities(['temperatureLevel']).required(true).multiple(true).permissions('rwx');
            section.deviceSetting('AC').capabilities(['airConditionerFanMode']).required(true).multiple(true).permissions('rwx');
        });
    })

    .updated(async (context, updateData) => {
        await context.api.subscriptions.delete()
        await context.api.subscriptions.subscribeToDevices(context.config.AC, 'airConditionerFanMode', 'fanMode', 'ACHandler')

    })

    // Called for both INSTALLED and UPDATED lifecycle events if there is no separate installed() handler
    .subscribedEventHandler('heater', async (context, event) => {
        if (event.value ==='on'){
            await context.api.devices.sendCommands(
                context.config.lightBulb,   // The device configuration
                'temperatureLevel',             // The capability
                'setTemperatureLevel',                 // The command
                [
                    {
                        temperatureLevel: 0
                    }
                ]
            );
        }
        else{
            await context.api.devices.sendCommands(
                context.config.lightBulb,   // The device configuration
                'temperatureLevel',             // The capability
                'setTemperatureLevel',                 // The command
                [
                    {
                        temperatureLevel: 25
                    }
                ]
            );
        }

    })




let port = process.env.PORT || 8721;
server.listen(port);
console.log(`Listening: http://127.0.0.1:${port}`);
