Guirlande 
============
### JenkinsCI + RPi + LED strip => Fireworks !

Guirlande is the French for "fairy light". It's a small M2M / IOT project that check Jenkins CI builds and display the status on a LED strip driven by Mihini Lua embedded application running on a Raspbery Pi.


Mihini application (led-controller) instructions
------------------------------------------------

You will need a Raspberry Pi (running e.g Raspbian) and an LPD8806 RGB LED strip (we are using http://www.adafruit.com/products/306)

Since the RGB LED strip will be accessed using SPI, you will need to have SPI support.  
You should either use a distribution already providing SPI, or follow the instructions here http://www.brianhensley.net/2012/07/getting-spi-working-on-raspberry-pi.html, including the unblacklisting stuff.

For all the instructions concerning the wiring of the strip to your Pi, you should follow http://learn.adafruit.com/light-painting-with-raspberry-pi/overview

In order to run the Mihini application controlling the RGB LED strip, you need to install Mihini on your RaspberryPi: http://wiki.eclipse.org/Mihini/Run_Mihini_on_an_Open_Hardware_platform

Launch the application using Koneki IDE, in a very similar manner to what is explained in the wiki page mentioned earlier.  
Make sure to launch the Mihini app (main.lua) as *root*. This is done by using root credentials when configuring your remote connection in Eclipse Koneki IDE.  
Of course, you can also launch main.lua application by hand on the Raspberry Pi, but this is likely going to be more SCP roundtrips between your system and the Pi if you still want to benefit from the Koneki IDE magic :)
