# Lightsaber prototyping with the Nordic Thingy:52

We're building a lightsaber!!! I don't want to give too much away, but a few weeks ago we started with the 3D print… I decided that while I wait for all of the components to arrive, I would get started on a prototype.

Obviously, our lightsaber would have to be wireless, so I thought we could rely on Bluetooth. Since I have a [Nordic Thingy:52](https://www.nordicsemi.com/Software-and-Tools/Prototyping-platforms/Nordic-Thingy-52) that I haven't played with yet, I thought it would be a great place to start for prototyping our lightsaber. It has the four things we need:

- Lights - because it's in the name
- Sound - to make it more cooler
- Button - so it turns off when you drop it (also known as the dead Jedi switch)
- Accelerometer - so we can detect movement

Connecting to the Thingy and using all of its Bluetooth attributes we can build a pretty good prototype. In order to identify all of these, I used [this repo](https://github.com/NordicPlayground/Nordic-Thingy52-Thingyjs) created by Nordic so that you can easily prototype with the Thingy:52. I decided it would be best to connect directly to the Bluetooth services and characteristics. In this way, when all of the components arrive, and we create our own custom Bluetooth lightsaber peripheral, we can just change the UUIDs and be up and running in no time!

If you'd like to know a bit more about how Bluetooth and Web Bluetooth work, you should check out the other two posts I wrote about these technologies:

- [BLE and GATT and other TLAs](https://medium.com/@gerybbg/ble-and-gatt-and-other-tlas-d6619cb684dd)
- [Web Bluetooth by example](https://medium.com/@gerybbg/web-bluetooth-by-example-6d200fa9a3ed)

In order to keep this post short, here are the links to the [HTML](https://github.com/geryb-bg/lightsaber/blob/master/thingy-poc/index.html) and [CSS](https://github.com/geryb-bg/lightsaber/blob/master/thingy-poc/styles.css) we'll be using. We will concentrate more on writing and understanding the JavaScript. We want to accomplish the following:

1. Connect to the lightsaber and check it's battery status.
2. When the button is pressed - turn on the led and play the turning on sound
3. When the button is released - turn off the led and play the turning off sound.
4. Be able to change the colour of the led when the lightsaber is on.
5. Play different sounds when the lightsaber is being moved around using the accelerometer data.

Let's get started!

## Connecting and battery

The first thing we need to do is initiate a scan for the device and connect to it. We also need to include all of the services that we might need in the optional services. Let's define a few variables so that we can interact with our HTML and so that we have all of the attribute UUIDs that we will need.

```js
//buttons
const connectButton = document.getElementById('connectButton');
const disconnectButton = document.getElementById('disconnectButton');
const colourButton = document.getElementById('colourButton');

//divs shown and hidden based on lightsaber status
const connect = document.getElementById('connect');
const control = document.getElementById('control');
const off = document.getElementById('off');

//spans displaying information loaded from lightsaber
const batteryStatus = document.getElementById('batteryStatus');
const orientationX = document.getElementById('orientationX');
const orientationY = document.getElementById('orientationY');
const orientationZ = document.getElementById('orientationZ');

//services
const batteryServiceUuid = 'battery_service';
const motionServiceUuid = 'ef680400-9b35-4933-9b10-52ffa9740042';
const userInterfaceServiceUuid = 'ef680300-9b35-4933-9b10-52ffa9740042';
const soundServiceUuid = 'ef680500-9b35-4933-9b10-52ffa9740042';

//characteristics
const batteryCharUuid = 'battery_level';
const orientationCharUuid = 'ef680404-9b35-4933-9b10-52ffa9740042';
const ledCharUuid = 'ef680301-9b35-4933-9b10-52ffa9740042';
const btnCharUuid = 'ef680302-9b35-4933-9b10-52ffa9740042';
const soundConfigCharUuid = 'ef680501-9b35-4933-9b10-52ffa9740042';
const speakerCharUuid = 'ef680502-9b35-4933-9b10-52ffa9740042';

let device, batteryCharacteristic, orientationCharacteristic;
let ledCharacteristic, btnCharacteristic, soundConfigCharacteristic, speakerCharacteristic;
```

Now we can connect:

```js
connectButton.onclick = async () => {
  device = await navigator.bluetooth.requestDevice({
    filters: [{ namePrefix: 'atc' }],
    optionalServices: [batteryServiceUuid, motionServiceUuid, userInterfaceServiceUuid, soundServiceUuid]
  });
  const server = await device.gatt.connect();

  batteryCharacteristic = await getCharacteristic(server, batteryServiceUuid, batteryCharUuid);
  orientationCharacteristic = await getCharacteristic(server, motionServiceUuid, orientationCharUuid);
  ledCharacteristic = await getCharacteristic(server, userInterfaceServiceUuid, ledCharUuid);
  btnCharacteristic = await getCharacteristic(server, userInterfaceServiceUuid, btnCharUuid);
  soundConfigCharacteristic = await getCharacteristic(server, soundServiceUuid, soundConfigCharUuid);
  speakerCharacteristic = await getCharacteristic(server, soundServiceUuid, speakerCharUuid);

  //what to do if the device is disconnected (code in next block)
  device.ongattserverdisconnected = disconnect;

  //display changes
  connected.style.display = 'block';
  connectButton.style.display = 'none';
  disconnectButton.style.display = 'initial';
};

const getCharacteristic = async (server, serviceUuid, characteristicUuid) => {
  const service = await server.getPrimaryService(serviceUuid);
  const char = await service.getCharacteristic(characteristicUuid);

  return char;
};
```

We also need to cater for disconnecting:

```js
disconnectButton.onclick = async () => {
  await device.gatt.disconnect();
  disconnect();
};

const disconnect = () => {
  device = null;
  batteryCharacteristic = null;

  connected.style.display = 'none';
  connectButton.style.display = 'initial';
  disconnectButton.style.display = 'none';
};
```

Now let's read the initial percentage of the battery and also listen to the characteristic changes so that we know when the battery level changes:

```js
const setUpDevice = async () => {
  //get initial battery value
  const batteryValue = await batteryCharacteristic.readValue();
  batteryStatus.innerText = batteryValue.getInt8(0);
};

const listen = () => {
  batteryCharacteristic.addEventListener('characteristicvaluechanged', (evt) => {
    const value = evt.target.value.getInt8(0);
    batteryStatus.innerText = value;
  });
  batteryCharacteristic.startNotifications();
};
```

Don't forget to call these two methods from the connect method:

```js
connectButton.onclick = async () => {
  //...

  await setUpDevice();
  listen();
};
```

Test this out by running it using something like [http-server](https://www.npmjs.com/package/http-server).

## Button and LED

We need to be able to turn the LED on and off based on whether the button is pressed or not. We do this by listening to the status of the button inside the `listen()` function we created earlier:

```js
let ledColour = new Uint8Array([1, 0, 0, 255]);
let lightsaberOn = false;
const toggleLed = async (toggle) => {
  if (toggle) {
    await ledCharacteristic.writeValue(ledColour);
    lightsaberOn = true;
    control.style.display = 'block';
    off.style.display = 'none';
  } else {
    await ledCharacteristic.writeValue(new Uint8Array([0]));
    lightsaberOn = false;
    control.style.display = 'none';
    off.style.display = 'block';
  }
};

const listen = () => {
  //...

  btnCharacteristic.addEventListener('characteristicvaluechanged', (evt) => {
    const value = evt.target.value.getInt8(0);
    toggleLed(value);
  });
  btnCharacteristic.startNotifications();
};
```

We should also turn everything off when we start up by calling this function inside our `setUpDevice()` function:

```js
const setUpDevice = async () => {
  //...

  //turn off when starting up
  await toggleLed(false);
};
```

Lets also allow our Jedi to change the colour of their lightsaber if they want to. We already have a colour picker and button in the HTML and we can use them like this:

```js
const hexToRgb = (hex) => {
  const r = parseInt(hex.substring(1, 3), 16); //start at 1 to avoid #
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);

  return [r, g, b];
};

colourButton.onclick = async () => {
  ledColour = new Uint8Array([1, ...hexToRgb(colourPicker.value)]);
  ledCharacteristic.writeValue(ledColour);
};
```

## Sound

Since we are going to have a set of pre-recorded lightsaber sounds, I thought it would be easiest to use the sample sounds on the Thingy:52. To do that we need to change the code we wrote above to start up the speaker:

```js
const setUpDevice = async () => {
  //...

  //turn on speaker
  const dataArray = new Uint8Array(2);
  dataArray[0] = 3 & 0xff;
  dataArray[1] = 1 & 0xff;
  await soundConfigCharacteristic.writeValue(dataArray);
};
```

We are going to use the first sample as the turning on sound and the second as the turning off sound:

```js
const getSampleSound = (sound) => {
  return new Uint8Array([sound & 0xff]);
};

const toggleLed = async (toggle) => {
  if (toggle) {
    //...
    await speakerCharacteristic.writeValue(getSampleSound(0));

  } else {
    //...
    await speakerCharacteristic.writeValue(getSampleSound(1));

  }
};
```

## Accelerometer

Lastly, we are going to use the motion of the lightsaber to trigger a few other sounds. We will first print out the X, Y and Z co-ordinates on the screen so we can see them changing. Add the following to the `listen()` function:

```js
const listen = () => {
  //...

  orientationCharacteristic.addEventListener('characteristicvaluechanged', (evt) => {
    let data = evt.target.value;
    let w = data.getInt32(0, true) / (1 << 30);
    let x = data.getInt32(4, true) / (1 << 30);
    let y = data.getInt32(8, true) / (1 << 30);
    let z = data.getInt32(12, true) / (1 << 30);
    const magnitude = Math.sqrt(Math.pow(w, 2) + Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2));

    if (magnitude !== 0) {
      x /= magnitude;
      y /= magnitude;
      z /= magnitude;
    }

    playSound(x, y, z);

    orientationX.innerText = `X: ${x.toFixed(2)}`;
    orientationY.innerText = `Y: ${y.toFixed(2)}`;
    orientationZ.innerText = `Z: ${z.toFixed(2)}`;
  });
  orientationCharacteristic.startNotifications();
};
```

The calculation above is directly from the Nordic repo, I did some reading  on what [quaternion rotation](https://en.wikipedia.org/wiki/Quaternions_and_spatial_rotation) is, but I will not try to explain it.

Now we can choose a different sample per movement and play them as the lightsaber moves around:

```js
let position = { x: 0, y: 0, z: 0 };
const playSound = async (x, y, z) => {
  if (lightsaberOn) {
    if (Math.abs(position.x - x) > 0.2) {
      await speakerCharacteristic.writeValue(getSampleSound(2));
    } else if (Math.abs(position.y - y) > 0.2) {
      await speakerCharacteristic.writeValue(getSampleSound(3));
    } else if (Math.abs(position.z - z) > 0.2) {
      await speakerCharacteristic.writeValue(getSampleSound(4));
    }
  }

  position.x = x;
  position.y = y;
  position.z = z;
};
```

We've also added a check in there to make sure that our lightsaber doesn't continue to make sounds when it turns off.

## Summary

Wow, that was quite a lot of code. If you got lost anywhere along the way you can check out the complete code on [GitHub](https://github.com/geryb-bg/lightsaber/tree/master/thingy-poc). We now have a lightsaber prototype. It has all of the things we require from our lightsaber, lights, sounds, dead Jedi switch. It just doesn't really look like a lightsaber, but that's because it's just a prototype, right?

I will definitely be posting more about this, and so will the rest of my team. So keep an eye out on this blog and my team's Twitter account for more updates on the complete fully functioning lightsaber.