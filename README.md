Guirlande 
============
### JenkinsCI + RPi + LED strip => Fireworks !

![guirlande live](https://pbs.twimg.com/media/BIIkdD9CUAA9qly.jpg:thumb)

Guirlande is the French for "fairy light".
It's a small M2M / IoT project that checks Jenkins CI builds and displays information related to their status on an LED strip driven by a Mihini Lua embedded application running on a Raspbery Pi.


Mihini application (led-controller) instructions
------------------------------------------------

You will need a Raspberry Pi (running e.g Raspbian) and an LPD8806 RGB LED strip (we are using http://www.adafruit.com/products/306)

* The RGB LED strip will be accessed over SPI, so you will need to have SPI support.  
You should either use a distribution already providing SPI, or follow the instructions here http://www.brianhensley.net/2012/07/getting-spi-working-on-raspberry-pi.html, including the unblacklisting stuff.
* For all the instructions concerning the wiring of the strip to your Pi, you should follow http://learn.adafruit.com/light-painting-with-raspberry-pi/overview
* In order to run the Mihini application controlling the RGB LED strip, you need to install Mihini on your RaspberryPi: http://wiki.eclipse.org/Mihini/Run_Mihini_on_an_Open_Hardware_platform
* You will need to associate your deviceId of choice to your Pi, so as commands being sent by the bot polling Jenkins are correctly sent to *your* system.  
Once Mihini is running on the Pi, you can change the deviceId by doing:
    * `telnet localhost 2000`
    * `agent.config.agent.deviceId = "yourUniqueId"`
    * `^D`  
You should then restart Mihini for the modification to be applied.  
* Launch the application using Koneki IDE, in a very similar manner to what is explained in the wiki page mentioned earlier.  
Make sure to launch the Mihini app (main.lua) as *root*. This is done by using root credentials when configuring your remote connection in Eclipse Koneki IDE.  
Of course, you can also launch main.lua application by hand on the Raspberry Pi, but this is likely going to be more SCP roundtrips between your system and the Pi if you still want to benefit from the Koneki IDE magic :)

Node.js application (guirlande.js) instructions
-----------------------------------------------

#### What does it do ?
Basically it polls *x* Jenkins builds status, check the "claim" state (see Claim report Jenkins plugin) and send a command to the Mihini application to update the LED strip. 
The 64 LED strip in will be split in *x* parts. Each parts are split like this :
* x * 3/4 for the build status
* x * 1/4 for the "claim" state

#### Instructions
Just clone this repo, get the necessary dependencies :  
`npm install`  

Create a *config.json* based on the template to : 
* Change the Jenkins builds urls
* Use your own m3da server instead of the default one hosted on m2m.eclipse.org
* Set the DeviceId  you already used in the Mihini application
* Tweak the polling period

And and launch it :  
 `node guirlande.js`

