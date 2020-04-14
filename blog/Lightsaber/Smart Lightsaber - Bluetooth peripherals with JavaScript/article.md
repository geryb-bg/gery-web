---
title: Smart Lightsaber - Bluetooth peripherals with JavaScript
description: When it came to choosing a wireless technology for the lightsaber we are building, my first thought was definitely Bluetooth. In this post I'd like to tell you a little bit about how a Bluetooth peripheral, such as our lightsaber, is built, using a library called bleno.
published: false
tags: Bluetooth, JavaScript, IoT
cover_image: images/header.jpg
---

I talk about Bluetooth a lot, you may have noticed this from my previous posts and if you have listened to my talks. Bluetooth has become my favourite wireless technology, even though working with it can be very frustrating at times. It does not provide the most reliable wireless connection, it is far from perfect, and the distances it works over are always less than advertised. However, once you understand the basics, it is really fun to work with.

When it came to choosing a wireless technology for the lightsaber we are building, my first thought was definitely Bluetooth. In this post I'd like to tell you a little bit about how a Bluetooth peripheral, such as our lightsaber, is built, using a library called [bleno](https://github.com/noble/bleno).

Before we get started, there are two other posts that I have written regarding Bluetooth, you should check them out as they would help with understanding parts of this post:

- [BLE and GATT and other TLAs](https://dev.to/gerybbg/ble-and-gatt-and-other-tlas-21f5)
- [Web Bluetooth by example](https://dev.to/gerybbg/web-bluetooth-by-example-46dh)

As described in the posts above, there are two types of Bluetooth devices:

- The central device (or **GATT Client**) which is in charge of scanning for devices, connecting and reading/writing data to the other device. This is usually a computer or a phone.
- The peripheral device (or **GATT Server**) is the device being connected to. It can perform certain functions and it exposes those functions over Bluetooth so that the central device can see and make use of them.

A Bluetooth connection can only ever be from a central to a peripheral device. My previous posts define how you can create a central device using the Web Bluetooth API and what that actually means. In this post I would like to take you through the other side of a Bluetooth connection. We will build the **GATT Profile** for our lightsaber using bleno. It will have one service and two characteristics, one for changing the colour of the light and one for reading the button status.

## Installing bleno

Our lightsaber runs on a Raspberry Pi Zero which has Raspbian Buster Light installed on it. In order to get bleno working, there are a few things we need to do.

Firstly, we need to have Node installed, I use [nvm](https://github.com/nvm-sh/nvm) to manage my Node versions. At the time of writing this post the bleno library has some problems with Node version 10, so I am using version 8.

Next we need to install some libraries that will help us control Bluetooth on the Pi Zero. We do this by running the following command:

```bash
sudo apt-get install bluetooth bluez libbluetooth-dev libudev-dev
```

Now we can install bleno, by using npm:

```bash
npm install bleno
```

## Building the characteristics

Let's start with creating the functions of the device, our two characteristics. Each characteristic has a list of properties that define what it can actually do. There are two properties that we care about in this example:

- Write - a characteristic that receives data from a central device and performs some function with it. In our case, this will change the colour of the light.
- Notify - a characteristic that reads data from the peripheral device and sends it onto the central device at a set interval. In our case, this will read the value of the button to determine if it is pressed or not and send that onto the central device.

Each characteristic also needs a universally unique identifier (UUID). I used [a generator](https://www.guidgenerator.com/) to create random UUIDs for these examples.

### Light characteristic

This characteristic will receive an unsigned integer array with three numeric values between 0 and 255, one for red, green and blue. This is what the code looks like:

```js
const bleno = require('bleno');
const { LIGHT_CHAR_UUID } = require('./characteristics');

module.exports = class LightCharacteristic extends bleno.Characteristic {
  constructor() {
    super({ uuid: LIGHT_CHAR_UUID, properties: ['write'] });

    this.red = 0;
    this.green = 0;
    this.blue = 0;
  }

  onWriteRequest(data, offset, withoutResponse, callback) {
    try {
      if (data.length !== 3) {
        callback(this.RESULT_INVALID_ATTRIBUTE_LENGTH);
        return;
      }

      this.red = data.readUInt8(0);
      this.green = data.readUInt8(1);
      this.blue = data.readUInt8(2);
      //change colour of light based on values

      callback(this.RESULT_SUCCESS);
    } catch (err) {
      console.error(err);
      callback(this.RESULT_UNLIKELY_ERROR);
    }
  }
};
```

There are a few parts of this code that I would like to point out:

- `const bleno = require('bleno');` - firstly, we have to import the bleno library.
- `class LightCharacteristic extends bleno.Characteristic` - we are extending the `Characteristic` class from bleno in order to create our characteristic.
- `super({ uuid: LIGHT_CHAR_UUID, properties: ['write'] });` - in the constructor we are creating our new characteristic by setting its UUID and its properties.
- `onWriteRequest(data, offset, withoutResponse, callback)` - we then override the `onWriteRequest` method so that when the central device sends data to this characteristic we can control what happens.
- `if (data.length !== 3)` - we have some error checking to ensure that the central device is sending the correct data.
- `this.red = data.readUInt8(0);` - we read our 3 values and change the colour of the lightsaber.
- `callback(this.RESULT_INVALID_ATTRIBUTE_LENGTH);`, `callback(this.RESULT_SUCCESS);` and `callback(this.RESULT_UNLIKELY_ERROR);` - based on what happens inside our method, we have to use the `callback` function to notify the central device that the commands have finished executing.

That's our light characteristic completed.

### Button Characteristic

The button characteristic will read the value of the button, 1 or 0, every 500 milliseconds and if the value has changed it will send that data to the central device inside a Buffer. Let's take a look at the code:

```js
const bleno = require('bleno');
const { BUTTON_CHAR_UUID } = require('./characteristics');

module.exports = class ButtonCharacteristic extends bleno.Characteristic {
  constructor() {
    super({ uuid: BUTTON_CHAR_UUID, properties: ['notify'] });

    this.buttonValue = '0';
  }

  onSubscribe(maxValueSize, updateValueCallback) {
    this.updateValueCallback = updateValueCallback;
  }

  onUnsubscribe() {
    this.updateValueCallback = null;
  }

  sendNotification(value) {
    if (!this.updateValueCallback) return;

    if (value !== this.buttonValue) {
      this.buttonValue = value;
      const notification = new Buffer(2);
      notification.writeInt16LE(this.buttonValue);

      this.updateValueCallback(notification);
    }
  }

  start() {
    this.buttonInterval = setInterval(() => {
      const data = readButton(); //read value of button
      this.sendNotification(data.toString());
    }, 500);
  }

  stop() {
    clearInterval(this.buttonInterval);
    this.buttonInterval = null;
  }
};
```

The start of this characteristic is very similar to the previous one, the only difference being the property which is set to 'notify'. However, the methods we override in this class are different:

- `onSubscribe(maxValueSize, updateValueCallback)` - this method is called when a central device connects to a peripheral device and starts listening for this particular characteristic value.
- `onUnsubscribe()` - we only want the peripheral device to continue sending the data if there is a central device listening. We use the unsubscribe method to clear the callback so that data does not continue being sent after the central device stops listening.
- `sendNotification(value)` - this is where most of the work happens, we check if there is a central device listening, we check if the button value has changed, we convert the value to a Buffer and send it onto the central device.
- `start()` and `stop()` - these two functions are only called internally on the peripheral device. When we fist set up the device we will start the notify characteristic, when we power it down, we will stop it.

That's all we need for the button characteristic. Now both of our characteristics are completed.

## Adding in our service

Every peripheral device has one or more services, they are there to combine similar functions (characteristics) together. In our case, since we only have two characteristics, we can probably make do with just one service. We will call it our primary service and give it a UUID. We use functionality from bleno to do this:

```js
const bleno = require('bleno');

const LightCharacteristic = require('./characteristics/lightCharacteristic');
const ButtonCharacteristic = require('./characteristics/buttonCharacteristic');

const lightWrite = new LightCharacteristic();
const buttonRead = new ButtonCharacteristic();
buttonRead.start();

function createService() {
  const service = new bleno.PrimaryService({
    uuid: PRIMARY_SERVICE_UUID,
    characteristics: [buttonRead, lightWrite],
  });

  bleno.setServices([service], (err) => {
    console.log(err || 'configuration done');
  });
}
```

## GATT Profile

Lastly, now that we have a service that contains our two functions, we need to wrap that and broadcast it over Bluetooth so that central devices can scan for it. We do this by listening to two events, the first is the `stateChanged` event:

```js
bleno.on('stateChange', (state) => {
  if (state === 'poweredOn') {
    bleno.startAdvertising('Lightsaber', [PRIMARY_SERVICE_UUID], (err) => {
      if (err) console.error(err);
    });
  } else {
    buttonRead.stop();
    bleno.stopAdvertising();
  }
});
```

There is only one state we care about, the `poweredOn` state. When the device turns on and this script starts running this event will fire with the `state` set to `poweredOn`. When this happens we need to `startAdvertising` the Bluetooth device. We give the device a name and the UUID of our primary service, this makes it discoverable by central devices. If the state is set to anything else, we stop the notify characteristic and `stopAdvertising`.

The other event we need to listen to is the `advertisingStart` event. This is triggered by the call to `startAdvertising` that we just talked about. The code looks as follows:

```js
bleno.on('advertisingStart', (err) => {
  if (err) {
    console.error(err);
    return;
  }

  createService();
});
```

All we need to do when this event fires is check for errors and call the `createService` method we created earlier.

## Summary

We created our characteristics, wrapped them in a service and added all the code needed to make the GATT profile of our peripheral device visible to central devices. That's all we need for our lightsaber to become Bluetooth enabled.

I only really mention the Bluetooth controlling parts of the code in this post. If you would like to read more about how to implement the button and LED strip of the lightsaber, you can take a look at my post on [Lights and sounds with the Raspberry Pi Zero](https://dev.to/gerybbg/lights-and-sounds-with-the-raspberry-pi-zero-3boj).

If you would like to take a look at the complete lightsaber code, have a look at my [GitHub repo](https://github.com/geryb-bg/lightsaber).

I now have a fully functioning Bluetooth lightsaber, but am continuously working on improving it. So keep an eye on my blog and follow me on [Twitter](https://twitter.com/gerybbg) if you'd like to find out what I'm planning next.
