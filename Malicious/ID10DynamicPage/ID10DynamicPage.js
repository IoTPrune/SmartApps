
// desc : When everyone leaves, change mode.  If at least one person home, switch mode based on sun position.

//Door  App  3003
const express = require('express');
const SmartApp = require('@smartthings/smartapp');
const server = module.exports = express();
server.use(express.json());
    

const app = new SmartApp();

/* Only here for Glitch, so that GET doesn't return an error */
server.get('/', (req, res) => {
  res.send('desc : When everyone leaves, change mode.  If at least one person home, switch mode based on sun position.');
});

/* Handles lifecycle events from SmartThings */
server.post('/', async (req, res) => {
    console.log(JSON.stringify(req.body, null, 2));
    app.handleHttpCallback(req, res);
});

const inputThreshold = 'threshold'
app.enableEventLogging(2)      // logs requests and responses as pretty-printed JSON
    .appId("b3aeaf43-dd34-4f35-a5e6-276153478b52")
    .permissions(['r:locations:*'],['r:devices:*'], ['x:devices:*'],['w:devices:*'])
    .page('mainPage', (context, page, configData) => {
    	page.section('safety', section => {
            // section.deviceSetting('dooLock').capabilities(['lock']).required(true).multiple(true).permissions('rwx');
            // section.deviceSetting('light').capabilities(['switch']).required(true).multiple(true).permissions('rwx');
            // section.deviceSetting('luminositySensor').capabilities(['illuminanceMeasurement']).required(true).multiple(true).permissions('rwx');
            section
                .textSetting(inputThreshold)
                .name('lower than what threshold should the light be on?');
        });
        
    })

    .updated(async (context, updateData) => {
        await context.api.subscriptions.delete()
        const cronExpression = "0 0 12 * * ?";
        await context.api.schedules.schedule('myScheduledCommand', cronExpression);
        // await context.api.subscriptions.subscribeToDevices(context.config.dooLock, 'lock', 'lock', 'dooLockHandler')
    })

    // Called for both INSTALLED and UPDATED lifecycle events if there is no separate installed() handler
    // .subscribedEventHandler('dooLockHandler', async (context, event) => {
    //     console.log("************")
    //     // if (event.value === 'unlocked'){
    //     //     let deviceList = await findDevicesByCapability(context) // find Illuminance sensors
    //     //     let isDarkerThanThreshold = await compareIlluminanceToThreshold(context, deviceList)
    //     //     if (isDarkerThanThreshold){
    //     //         await SendDeviceCommand(context, 'switch' , 'on')
    //     //     }
    //     // }
    // })


    .scheduledEventHandler('myScheduledCommand', async (context, event) => {
        console.log("************")
    });


    async function findDevicesByCapability(context){
        let deviceList = await context.api.devices.findByCapability('illuminanceMeasurement')
        return deviceList
    }

    async function compareIlluminanceToThreshold(context, deviceList){
        for (deviceIndex in deviceList){
            let deviceStatus = await getDeviceStatus(context, deviceList[deviceIndex].deviceId)
            let illuminanceValue = getDeviceIlluminanceValue(deviceStatus)
            let illuminanceThreshold = extractUserInput(context, inputThreshold)
            if ( illuminanceValue < illuminanceThreshold)
                return true
                break;
        }
        return false;
    }

    async function getDeviceStatus(context, deviceId){
        let deviceStatus = await context.api.devices.getStatus(deviceId)
        return deviceStatus
    }

    function getDeviceIlluminanceValue(deviceStatus){
        let illuminanceValue = deviceStatus.components.main.illuminanceMeasurement.illuminance.value;
        return illuminanceValue
    }

    function extractUserInput(context, inputLabel){
        const config = context.config;
        const threshold = configNumberValue(config, inputLabel);
        return threshold
    }

    async function SendDeviceCommand(context, attribute, commandValue){
        await context.api.devices.sendCommands(context.config.light, attribute, commandValue);
    }

    function configNumberValue(config, name) {
        return parseInt(config[name]?.[0]?.stringConfig?.value);
    }


    
let port = process.env.PORT || 8717;
server.listen(port);
console.log(`Listening: http://127.0.0.1:${port}`);
