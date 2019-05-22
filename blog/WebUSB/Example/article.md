# WebUSB by example

![header logo](images/header.png "")

I have been researching the WebUSB API for a while now, how it works and what it can be used for. If you have not yet, take a look at the previous article I wrote on this topic: [USB: A web developer perspective](https://medium.com/@gerybbg/usb-a-web-developer-perspective-cbee13883c89). Even after reading a lot about the topic, I still struggled, until I tried it myself.

I always find that the best way to learn is to write some code, so in this article we are going to do exactly that.

## What you will need

- [nRF52 dongle](https://www.nordicsemi.com/?sc_itemid=%7BCDCCA013-FE4C-4655-B20C-1557AB6568C9%7D)
- [nrfutil](https://github.com/NordicSemiconductor/pc-nrfutil)
- [http-server](https://www.npmjs.com/package/http-server) (or something similar)

## The hardware

Something important to understand about the WebUSB API is that it is not the code that runs on the device. It is the code we use to control the device and communicate with it via USB. This means we still require some code running on the device. In the case of the nRF52 dongle we are going to use [Zephyr](https://www.zephyrproject.org/) and the code created by Lars Knudsen in [this GitHub repo](https://github.com/larsgk/web-nrf52-dongle).

If you would like to build the firmware yourself you would first have to follow the instructions for [Getting Started]((https://twitter.com/denladeside)) with Zephyr. Then, you would have to follow the instructions in [the repo](https://github.com/larsgk/web-nrf52-dongle/tree/master/dongle_firmware) for building the firmware and flashing it onto the device.

I'd prefer to keep the focus of the tutorial on the WebUSB side of things. If you are more interested in the web parts as well then you can download the already [packaged zip file](https://github.com/larsgk/web-nrf52-dongle/releases) from Lars' repo and flash it onto the device with the command `nrfutil dfu serial -pkg pkg.zip -p /dev/ttyACM0` replacing the `/dev/ttyACM0` with the USB port that your device is plugged into.

## Connecting

Let's start with connecting to the USB device. I have already created [HTML](https://github.com/geryb-bg/gery-web/blob/master/blog/WebUSB/Example/code/index.html) and [CSS](https://github.com/geryb-bg/gery-web/blob/master/blog/WebUSB/Example/code/styles.css) files for this project as these are not the parts we are going to concentrate on. We are going to concentrate on writing the JavaScript that connects it all together.

There are however a few small things in the HTML file we need to keep in mind:

- Three _buttons_ with IDs: `connectButton`, `disconnectButton` and `colourButton`.
- A _div_ with ID `connected`.
- An _input_ of type _color_ with ID `colourPicker`.
- Two _spans_ with IDs `deviceHeartbeat` and `deviceButtonPressed`.

The first thing we need to do in our JavaScript code is declare all of these elements:

```js
const connectButton = document.getElementById('connectButton');
const disconnectButton = document.getElementById('disconnectButton');
const colourPicker = document.getElementById('colourPicker');
const colourButton = document.getElementById('colourButton');
const connect = document.getElementById('connect');
const deviceHeartbeat = document.getElementById('deviceHeartbeat');
const deviceButtonPressed = document.getElementById('deviceButtonPressed');
```

Now we can start working with them and the device. We need to connect to the device, select a configuration and claim an interface:

```js
let device;
connectButton.onclick = async () => {
  device = await navigator.usb.requestDevice({
    filters: [{ vendorId: 0x2fe3 }]
  });
  
  await device.open();
  await device.selectConfiguration(1);
  await device.claimInterface(0);
  
  connected.style.display = 'block';
  connectButton.style.display = 'none';
  disconnectButton.style.display = 'initial';
};
```

We would also like to be able to disconnect from the device, that part is simply done by calling the `.close()` method:

```js
disconnectButton.onclick = async () => {
  await device.close();
  
  connected.style.display = 'none';
  connectButton.style.display = 'initial';
  disconnectButton.style.display = 'none';
};
```

Run this code using http-server and try connecting and disconnecting from your device. When connected you should see a little USB symbol right next to the close button of your browser tab:

![alt USB Symbol next to close button](images/usb.png "")

## Blinking an LED

When we first learn a new programming language, the first thing we always do is write a "Hello World" program. The electronics equivalent is blinking an LED. Now that we are connected to the device, we can start blinking our LED.

Our colour picker input gives us the hex value of a colour. We need to change that to RGB:

```js
const hexToRgb = (hex) => {
  const r = parseInt(hex.substring(1,3), 16); //start at 1 to avoid #
  const g = parseInt(hex.substring(3,5), 16);
  const b = parseInt(hex.substring(5,7), 16);

  return [r, g, b];
}
```

With that function in place we can now send the colour data to the device. The data must be put into an unsigned integer array in order to be transferred via USB. The device firmware is expecting the number 1 as the first element in the data array, followed by the three colour numbers. On button click we do the following:

```js
colourButton.onclick = async () => {
  const data = new Uint8Array([1, ...hexToRgb(colourPicker.value)]);
  await device.transferOut(2, data);
};
```

That's all we need to get our LED to change colours. Run the code again and change the LED colour a few times.

## Listening for data

The last thing we want to do is listen for when the button on the device is pressed and display that on our web page. To do that we need to implement a `listen()` method as follows:

```js
const listen = async () => {
  const result = await device.transferIn(3, 64);

  const decoder = new TextDecoder();
  const message = decoder.decode(result.data);

  const messageParts = message.split(' = ');
  if (messageParts[0] === 'Count') {
    deviceHeartbeat.innerText = messageParts[1];
  } else if (messageParts[0] === 'Button' && messageParts[1] === '1') {
    deviceButtonPressed.innerText = new Date().toLocaleString('en-ZA', {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });
  }
  listen();
};
```

The device sends us two types of messages:

- A device heartbeat, so that we can ensure we are still connected to it.
- A button pressed message, when the button is pressed (1) and released (0).

As you can see we are calling the listen method from within itself, this means that as soon as we receive a message we start listening for the next one.

One last thing left to do, and that is to start listening after we connect to the device. At the bottom of the `connectButton.onclick` function add a call to the `listen()` method.

We should now have our heartbeat and button presses displayed on the page.

## Conclusion

This is quite a short example of some of the things you can do with WebUSB, the code for the whole example can be found on [GitHub](https://github.com/geryb-bg/gery-web/tree/master/blog/WebUSB/Example/code). If you would like to take a look at some of the other USB devices I have been playing with, take a look at [this repo](https://github.com/geryb-bg/webusbs) which has an Arduino and Fingerprint reader example.

Lastly, I'd just like to thank [Lars Knudsen](https://twitter.com/denladeside) for the nRF52 dongle, and [Mike Geyser](https://twitter.com/mikegeyser) for bringing it.