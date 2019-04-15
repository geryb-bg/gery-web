# USB: a web developer perspective

One of the reason I really like my job is because I get to work with the technologies that I love. Two of these technologies are JavaScript and IoT. Now, I know you might think I'm crazy when I say this next part, but one of my favorite pass times is trying to make these two technologies work together. Taking what would generally be considered a "dumb" device and making it smart by using JavaScript. For this reason I was really excited when I heard about WebUSB.

The WebUSB API is a relatively new standard which allows us to access USB devices from the browser. There are a number of tutorials, articles and talks online which explain what the purpose of this new technology is and how to use it. The following list has some of the resources I have been using to figure this out:

- [Access USB Devices on the Web](https://developers.google.com/web/updates/2016/03/access-usb-devices-on-the-web)
- [Exploring WebUSB and its exciting potential - Suz Hinton - JSConf US 2018](https://www.youtube.com/watch?v=IpfZ8Nj3uiE)
- [WebUSB API Spec](https://wicg.github.io/webusb/)

These are all great resources, and there are so many more. However, almost all of the resources I have looked at for WebUSB say one very important thing:

> You have to understand how the USB standard works in order to be able to use this API.

In this post, I would like to share with you the web developer version of the USB standard. Or at least the parts you need to understand in order to get started with the WebUSB API. Let's take a look at some code ([adapted from this post](https://developers.google.com/web/updates/2016/03/access-usb-devices-on-the-web)):

```js
let device;
let vendorId = 0x00; //the vendor ID of the USB device

navigator.usb.requestDevice({ filters: [{ vendorId }] })
.then(selectedDevice => {
   device = selectedDevice;
   return device.open();
 })
.then(() => device.selectConfiguration(1))
.then(() => device.claimInterface(2))
.then(() => device.controlTransferOut({
    requestType: 'class',
    recipient: 'interface',
    request: 0x22,
    value: 0x01,
    index: 0x02}))
.then(() => device.transferIn(5, 64))
.then(result => console.log(`Received: ${result}`))
.catch(error => { console.log(error); });
```

Besides the callback hell you see above there are also a number of important methods we need to understand:

## `vendorId`

The vendor ID is a hexadecimal number that is assigned by the [USB-IF](https://www.usb.org/) and the manufacturer of the device. This ID as well as the product ID can be added to the filters of the request device method. If there are no filters specified then all of the USB devices plugged in to your computer will be returned.

## `requestDevice`

This method can only be called from a user gesture, for instance a button click. This is a security feature, it means that you as the user have to initiate the scan for USB devices plugged into your computer. This scan produces a list of devices and allows you to choose one to connect to. For example, this is the scan on my computer without any filters:

![alt request device scan](images/requestdevice.png "")

## `device.open`

Once you choose a device to connect to the connection is started by calling the `open()` method.

## `device.selectConfiguration`

Now that we have established a connection we have to find which of the device's configurations we can communicate with. There are not many devices that have more than one configuration. The configuration consists of values for the amount of power needed, if the device is self or bus powered and the number of interfaces it has. The important part to remember here is that only one configuration is enabled at a time. The enabled configuration is how, for example, your cellphone knows if it is plugged into a laptop or straight into the mains.

## `device.claimInterface`

Next we have to claim the interface. An interface is grouping of functions of the device which together form one feature that the device can perform. By claiming the interface we are taking control of that particular feature of the device. We do that by communicating with the input and output endpoints of the selected interface.

## `device.controlTransferOut`
## `device.transferIn`

Explain differences between types of transfers...
- https://wicg.github.io/webusb/#appendix-transfers

## Conclusion