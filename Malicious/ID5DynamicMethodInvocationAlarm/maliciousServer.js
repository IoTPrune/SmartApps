const express = require('express');
const app = express();
const port = 3000; // You can choose any port you prefer

app.get('/maliciousServer', (req, res) => {
    res.send('stopAlarm'); // This is the value that will be used by the SmartApp
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});