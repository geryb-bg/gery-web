# Web Bluetooth by example

The Web Bluetooth API is quite a powerful feature of the web. It has a lot of potential and some really cool capabilities. However, getting started with it can be a little daunting. In this article I'd like to take you through building an example using the API with the [nRF52 dongle](https://www.nordicsemi.com/?sc_itemid=%7BCDCCA013-FE4C-4655-B20C-1557AB6568C9%7D). Before starting with the code, if you would like to know more about the theory of the Web Bluetooth API, checkout my previous post: [_BLE and GATT and other TLAs_](https://medium.com/@gerybbg/ble-and-gatt-and-other-tlas-d6619cb684dd).

We are going to be following a very similar example to my [_WebUSB by example_](https://medium.com/@gerybbg/webusb-by-example-b4358e6a133c) post, with most of the code adapted from this [GitHub repo](https://github.com/larsgk/web-nrf52-dongle). We will be building a website, from scratch, that will connect to the Bluetooth device, send data to it to update the colour of the LED and receive data from it when we push the button.

## What you will need

- [nRF52 dongle](https://www.nordicsemi.com/?sc_itemid=%7BCDCCA013-FE4C-4655-B20C-1557AB6568C9%7D)
- [nrfutil](https://github.com/NordicSemiconductor/pc-nrfutil): for flashing the firmware onto the device
- [http-server](https://www.npmjs.com/package/http-server) (or something similar): for starting up our website locally
- A computer which has a built in Bluetooth module, or a USB Bluetooth dongle. I use [this one](https://www.kensington.com/p/products/connectivity/usb-hubs-adapters/kensington-bluetooth-4.0-usb-adapter/).

## The hardware

We need to ensure that the nRF52 dongle is flashed with the correct software so that we can access it's Bluetooth capabilities. If you have already done this, by following the instructions in my [WebUSB post](https://medium.com/@gerybbg/webusb-by-example-b4358e6a133c), then you can skip to the next section. If you have not, then please keep reading.

We will be using [Zephyr](https://www.zephyrproject.org/), which is an operating system for small embedded devices. If you are interested in building the firmware and installing it yourself then you can take a look at the instructions on [Getting Started with Zephyr](https://docs.zephyrproject.org/latest/getting_started/index.html). Once you have it setup you will have to build the firmware and flash it onto the dongle by following [the instructions here](https://github.com/larsgk/web-nrf52-dongle/tree/master/dongle_firmware).

This tutorial is going to focus on the Web Bluetooth API, so you can just download the [packaged zip file](https://github.com/larsgk/web-nrf52-dongle/releases) from Lars' repo and flash it onto the device with the command `nrfutil dfu serial -pkg pkg.zip -p /dev/ttyACM0` replacing the `/dev/ttyACM0` with the USB port that your device is plugged into.

## The Setup

As mentioned earlier, we are going to be building this website almost completely from scratch. Since the parts we are concentrating on will be the JavaScript, you can download the HTML and CSS parts and just use them. There are a few things that need to be mentioned in the HTML file that we will be referring to when we get to writing our JavaScript:

- Three _buttons_ with IDs: `connectButton`, `disconnectButton` and `colourButton`.
- A _div_ with ID `connected`.
- An _input_ of type _color_ with ID `colourPicker`.
- Two _spans_ with IDs `deviceHeartbeat` and `deviceButtonPressed`.