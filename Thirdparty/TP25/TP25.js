
// desc : SmartApp that turns on a switch for selected length of time when motion is sensed, then ignores motion for some time before enabling again.

//Door  App  3003
const express = require('express');
const SmartApp = require('@smartthings/smartapp');
const server = module.exports = express();
server.use(express.json());
    

const app = new SmartApp();

/* Only here for Glitch, so that GET doesn't return an error */
server.get('/', (req, res) => {
  res.send('desc : SmartApp that turns on a switch for selected length of time when motion is sensed, then ignores motion for some time before enabling again.');
});

/* Handles lifecycle events from SmartThings */
server.post('/', async (req, res) => {
    console.log(JSON.stringify(req.body, null, 2));
    app.handleHttpCallback(req, res);
});

app.enableEventLogging(2)      // logs requests and responses as pretty-printed JSON
    .appId("0f744e0a-490b-4809-bfd2-4baa4f9c591d")
    .permissions(['r:locations:*'],['r:devices:*'], ['x:devices:*'],['w:devices:*'])
    .page('mainPage', (context, page, configData) => {
    	page.section('safety', section => {
            section.deviceSetting('motionSensor').capabilities(['motionSensor']).required(true).multiple(true).permissions('rwx');
            // section.deviceSetting('light').capabilities(['switch']).required(true).multiple(true).permissions('rwx');
            // section
            //     .textSetting('timeInterval')
            //     .name('after what time should the light be off, minutes');
            // section
            //     .textSetting('ignoranceTimeInterval')
            //     .name('Ignore motion after off time, minutes');
        });
        
    })

    .updated(async (context, updateData) => {
        await context.api.subscriptions.delete();
        const now = new Date();
        const scheduleTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 22, 32, 0);
        await context.api.schedules.schedule('sunset','expression', scheduleTime);
        // let delay = 10
        // await runScheduler(context, scheduleTime)
        // await context.api.subscriptions.subscribeToDevices(context.config.motionSensor, 'motionSensor', 'motion', 'motionSensorHandler')
    })

    // Called for both INSTALLED and UPDATED lifecycle events if there is no separate installed() handler
    // .subscribedEventHandler('motionSensorHandler', async (context, event) => {
    //     const userInputs = extractUserInput(context)
    //     await SendDeviceCommand(context, 'on')
    //     await runScheduler(context, userInputs.timeInterval, 'turnOffLight')
    //     await unsubscribeTemporarily(context)
    //     await runScheduler(context, userInputs.ignoranceTimeInterval + userInputs.timeInterval , 'subscribeForDeviceEventAgain')
    // })

    .scheduledEventHandler('sunset', async (context, event) => {
        console.log("****************")
        // await SendDeviceCommand(context, 'off')
    })

    // .scheduledEventHandler('subscribeForDeviceEventAgain', async (context, event) => {
    //     await context.api.subscriptions.delete()
        
    //     await context.api.subscriptions.subscribeToDevices(context.config.motionSensor, 'motionSensor', 'motion', 'motionSensorHandler')
    // })

    // function extractUserInput(context){
    //     const config = context.config;
    //     const timeInterval = configsNumberValue(config, 'timeInterval');
    //     const ignoranceTimeInterval = configsNumberValue(config, 'ignoranceTimeInterval');
    //     return {
    //         "timeInterval": timeInterval,
    //         "ignoranceTimeInterval": ignoranceTimeInterval
    //     }
    // }


    // async function SendDeviceCommand(context, commandValue){
    //     await context.api.devices.sendCommands(context.config.light, 'switch', commandValue);
    // }



    // function configsNumberValue(config, name) {
    //     return parseInt(config[name]?.[0]?.stringConfig?.value);
    // }

    // async function runScheduler(context, delayTime, schedulerName){
    //     const delay = 60 * delayTime; // delay in minutes (1000 * 60 is one minute)
    //     await context.api.schedules.runIn(schedulerName, delay);
    // }

    // async function unsubscribeTemporarily(context){
    //     await context.api.subscriptions.unsubscribeAll()
    // }
    

    
let port = process.env.PORT || 8714;
server.listen(port);
console.log(`Listening: http://127.0.0.1:${port}`);


