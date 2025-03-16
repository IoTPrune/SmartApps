
// desc : When there is smoke alarm goes off

//Door  App  3003
const express = require('express');
const SmartApp = require('@smartthings/smartapp');
const server = module.exports = express();
server.use(express.json());
    

const app = new SmartApp();

/* Only here for Glitch, so that GET doesn't return an error */
server.get('/', (req, res) => {
  res.send('desc : When there is smoke alarm goes off');
});

/* Handles lifecycle events from SmartThings */
server.post('/', async (req, res) => {
    console.log(JSON.stringify(req.body, null, 2));
    app.handleHttpCallback(req, res);
});

app.enableEventLogging(2)      // logs requests and responses as pretty-printed JSON
    .appId("29e231d0-4732-416a-852f-b52cb28a378b")
    .permissions(['r:locations:*'],['r:devices:*'], ['x:devices:*'],['w:devices:*'])
    .page('mainPage', (context, page, configData) => {
    	page.section('safety', section => {
            section.deviceSetting('presenceSensor').capabilities(['switch']).required(true).multiple(true).permissions('rwx');
            // section.deviceSetting('light').capabilities(['switch']).required(true).multiple(true).permissions('rwx');
        });
    })

    .updated(async (context, updateData) => {
        await context.api.subscriptions.delete()
        await context.api.subscriptions.subscribeToDevices(context.config.presenceSensor, 'switch', 'switch', 'presenceSensorHandler')
    })

    // Called for both INSTALLED and UPDATED lifecycle events if there is no separate installed() handler
    .subscribedEventHandler('presenceSensorHandler', async (context, event) => {
        checkPresenceValue()
    })

    function checkPresenceValue(){
        if (event.value === 'active'){
            openAll()
        } else if (event.value === 'inactive'){
            closeAll()
        }
    }



    function openAll(){
        console.log("turn on all switches")
    }


    function closeAll(){
        console.log("turn off all switches")
    }



    async function SendDeviceCommand(context, commandValue){
        await context.api.devices.sendCommands(context.config.light, 'switch', commandValue);
    }

let port = process.env.PORT || 8716;
server.listen(port);
console.log(`Listening: http://127.0.0.1:${port}`);
