# BLE and GATT

In the last year and a bit, I have done quite a few different talks related to connecting to bluetooth devices from the browser. More recently, I started working with USB devices on the web as well. I have written a few short things about the WebUSB API which you can checkout [here](https://medium.com/@gerybbg/usb-a-web-developer-perspective-cbee13883c89) and [here](https://medium.com/@gerybbg/webusb-by-example-b4358e6a133c). I thought it was time I wrote down some of my findings about the Web Bluetooth API as well.

The Web Bluetooth API is all about connecting to bluetooth low energy (BLE) devices directly from your web browser. This is a really exciting technology, because it means that web developers, like me, can now connect to bluetooth devices as well. It has some limitations, a few security considerations, and it is not completely supported yet, since it is not on the standardisation path. Even so, this should not stop you from trying it out. Here are some good resources I used to get started:

- [Interact with Bluetooth devices on the Web](https://developers.google.com/web/updates/2015/07/interact-with-ble-devices-on-the-web)
- [Is Now a Good Time to Start using Web Bluetooth?](https://medium.com/@urish/is-now-a-good-time-to-start-using-web-bluetooth-hint-yes-yes-it-is-99e998d7b9f6)
- [Web Bluetooth API Specification](https://webbluetoothcg.github.io/web-bluetooth/)

However, Before we can get to the code, we need to make sure we understand how the hardware side of things is going to work. In this article, I'd like to tell you what you need to know about BLE and GATT, so that you can hack away at your own bluetooth devices using JavaScript. Let's take a look at a small piece of code adapted from the [Web Bluetooth Community Group GitHub](https://github.com/WebBluetoothCG/demos) and talk about all of the important hardware parts.

```js
let characteristic;

async function connect() {
    const device = await navigator.bluetooth.requestDevice({filters:[{services:[ 'heart_rate' ]}]});
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService('heart_rate');
    characteristic = await service.getCharacteristic('heart_rate_measurement');
}

async function startNotification() {
    return await characteristic.startNotifications();
}

async function stopNotification() {
    return await characteristic.stopNotifications();
}

```

The Bluetooth Generic Attributes (GATT) Profile is the way that bluetooth devices communicate with each other. It defines a hierarchical data structure for communication between two bluetooth devices. It is based on the Attribute Protocol (ATT), which is a low level mechanism for transferring units of data. This profile facilitates the communication between a central bluetooth device, such as your phone or computer, and a peripheral bluetooth device, such as a heart rate monitor or bluetooth headphones.

## Profile, Server and Client

```js
const device = await navigator.bluetooth.requestDevice({filters:[{services:[ 'heart_rate' ]}]});
```

In the code above we are initiating a scan for bluetooth devices, we are using a filter so that we will only show devices that have a `heart_rate` service (we will talk about the service a little later). This will present the user with something that looks like this:

//TODO image of heart rate monitor scan.

The filter is there for two reasons:

1. So that the user is not confused by the large number of devices in the list.
2. Making the user feel a little bit more secure by limiting what devices the programmer is scanning for.

Once the user has selected a device and clicked connect we can connect to the device:

```js
const server = await device.gatt.connect();
```

The peripheral device (heart rate monitor in this case), also known as the GATT server, holds the profile. The central device, also known as the GATT client, is the device that initiates the connection, sends instructions to the server and receives data back from it. How the data travels between the two devices is defined by Services and Characteristics.

## Services

```js
const service = await server.getPrimaryService('heart_rate');
```

A profile consists of a number of services. Services are the behaviours of a device. For example, our heart rate monitor would have a heart rate service. The service is identified by a universally unique identifier (UUID).

## Where do I find the UUID

A UUID falls into one of two categories:

1. A name or 16-bit numeric ID, like `heart-rate`, used for common peripheral devices. These are services and characteristics that have been adopted by the [Bluetooth Special Interest Group](https://www.bluetooth.com/).
2. A 128-bit numeric ID, these are used for custom services and characteristics that have been created for devices that are new or differ from the standards. (If you were creating your own bluetooth device using a library like [bleno](https://github.com/noble/bleno), you would create your own 128-bit UUIDs).

For the first, you can find a list of all of them on the Bluetooth SIG website.