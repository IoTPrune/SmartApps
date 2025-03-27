# 📌 IoTPrune - smartapp dataset compatible with Smartthings

## Overview  
This repository includes a collection of SmartThings-compatible Node.js applications, divided into handcrafted malicious apps and third-party community apps. It is well-suited for research studies, offering an opportunity to compare with state-of-the-art solutions.

## Repository Structure 
📦 IotPrune  
&nbsp;&nbsp;┣ 📂 Malicious/      # Handcrafted SmartThings apps with security vulnerabilities  
&nbsp;&nbsp;┃&nbsp;&nbsp;┣ 📜 ID1BrightenMyPath  
&nbsp;&nbsp;┃&nbsp;&nbsp;┣ 📜 ID3SmokeAlarm 
&nbsp;&nbsp;┃&nbsp;&nbsp;┗ 📜 ...  
&nbsp;&nbsp;┣ 📂 ThirdParty/    # SmartThings community-developed apps  
&nbsp;&nbsp;┃&nbsp;&nbsp;┣ 📜 TP10.js  
&nbsp;&nbsp;┃&nbsp;&nbsp;┣ 📜 TP11.js  
&nbsp;&nbsp;┃&nbsp;&nbsp;┗ 📜 ...  
&nbsp;&nbsp;┣ 📜 README.md            # This file  

### Folder Details  
- **`Malicious/`** → Contains **intentionally designed** SmartThings apps that exhibit different types of vulnerabilities.  
- **`ThirdParty/`** → Contains **SmartThings community applications** that may or may not have security issues.

## Types of Malicious Points Covered  
This repository examines different types of security issues, including:  

- **Code Injection** – Executing unintended code dynamically.  
- **Missing Subscription** – Apps missing subscriptions to necessary events, leading to non-response or unhandled events.  
- **Missing Command** – Apps failing to issue necessary commands to devices, leaving them in an incorrect state.  
- **Malicious (Scheduled) Command** – Apps scheduling malicious or unintended commands for execution at a later time.  
- **Conflicting Commands (One App)** – Apps issuing conflicting commands to a device.  
- **Endless Loop Commands** – Apps issuing commands that cause a device or system to enter a perpetual loop.  
- **Race Conditions** – Apps that change device state in conflicting way.
- **Data Leak** – Leaking data about the state of the house or devices (e.g., occupancy, device status).  

## How to Use the Repository  
### 🔧 Setup Instructions  
1. **Clone the repository:**  
   ```bash
   git clone https://github.com/yourusername/repository-name.git
   cd repository-name
2. **Install libraries**
   
   The applications are built with Node.js for SmartThings. Ensure you have Node.js installed.

3. **Running the Applications**
Each application runs on a different port on localhost. If needed, update the port in the respective script files before running.
To start an application, use:
    ```bash
    node <app_filename>.js
    node Malicious/ID3SmokeAlarm #example
     
##  Disclaimer  
This repository is for **research and educational purposes only**. The malicious apps included here are **intentionally designed** to demonstrate security weaknesses in SmartThings applications.  
Do not deploy these apps on real devices or production environments.

---

## References  
Here are some useful resources for understanding SmartThings security and IoT vulnerabilities:  

- [IoTBench](https://github.com/IoTBench/IoTBench-test-suite/tree/master/smartThings/smartThings-Soteria)  
- [Smartthings community](https://community.smartthings.com/)  
- [IoTGaurd](https://www.ndss-symposium.org/ndss-paper/iotguard-dynamic-enforcement-of-security-and-safety-policy-in-commodity-iot/)
- 
## Contributing
If you'd like to contribute to this dataset, please fork the repository and submit a pull request.  
