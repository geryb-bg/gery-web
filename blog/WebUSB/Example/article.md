# WebUSB by example

I have spent the last few weeks doing more research into the WebUSB API, how it works and what it can be used for. If you have not yet, take a look at the previous article I wrote on this topic: [USB: A web developer perspective](https://medium.com/@gerybbg/usb-a-web-developer-perspective-cbee13883c89). Even after reading a lot about the topic, I still struggled, until I tried it myself.

I always find that the best way to learn is to write some code, so in this article we are going to do exactly that.

## What you will need

- [nRF52 dongle](https://www.nordicsemi.com/?sc_itemid=%7BCDCCA013-FE4C-4655-B20C-1557AB6568C9%7D)
- [http-server](https://www.npmjs.com/package/http-server) (or something similar)

## The hardware

Something important to understand about the WebUSB API is that it is not the code that runs on the device, it is just the code we use to control the device and communicate with it via USB. This means we still require some code running on the device. In the case of the nRF52 dongle we are going to use [Zephyr](https://www.zephyrproject.org/) and the code created by Lars Knudsen in [this GitHub repo](https://github.com/larsgk/web-nrf52-dongle).

If you would like to build the firmware yourself you would first have to follow the instructions for [Getting Started]((https://twitter.com/denladeside)) with Zephyr. Then, you would have to follow the instructions in [the repo](https://github.com/larsgk/web-nrf52-dongle/tree/master/dongle_firmware) for building the firmware and flashing it onto the device.

I'd prefer to keep the focus of the tutorial on the WebUSB side of things. If you can't get the above to work, and you are more interested in the web parts as well then you can download the already [packaged zip file](https://github.com/larsgk/web-nrf52-dongle/releases) from Lars' repo and flash it onto the device with the command `nrfutil dfu serial -pkg pkg.zip -p /dev/ttyACM0` replacing the `/dev/ttyACM0` with the port that your device is plugged into.

## Blinking an LED

When we first learn a new programming language, the first thing we always do is write a "Hello World" program. The electronics equivalent is blinking an LED, so lets start there. I have already created html and css files for this project.


Lastly, I'd just like to thank [Lars Knudsen](https://twitter.com/denladeside) for the nRF52 dongle, and [Mike Geyser](https://twitter.com/mikegeyser) for bringing it.