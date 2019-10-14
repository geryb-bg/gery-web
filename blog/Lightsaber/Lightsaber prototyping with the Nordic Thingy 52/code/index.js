const connectButton = document.getElementById('connectButton');
const disconnectButton = document.getElementById('disconnectButton');
const colourButton = document.getElementById('colourButton');

const connect = document.getElementById('connect');
const batteryStatus = document.getElementById('batteryStatus');
const orientationX = document.getElementById('orientationX');
const orientationY = document.getElementById('orientationY');
const orientationZ = document.getElementById('orientationZ');
const control = document.getElementById('control');
const off = document.getElementById('off');

// const TCS_UUID = 'ef680100-9b35-4933-9b10-52ffa9740042';
// const TES_UUID = 'ef680200-9b35-4933-9b10-52ffa9740042';
// const DFU_UUID = '0000fe59-0000-1000-8000-00805f9b34fb';
const batteryServiceUuid = 'battery_service';
const motionServiceUuid = 'ef680400-9b35-4933-9b10-52ffa9740042';
const userInterfaceServiceUuid = 'ef680300-9b35-4933-9b10-52ffa9740042';
const soundServiceUuid = 'ef680500-9b35-4933-9b10-52ffa9740042';

const batteryCharUuid = 'battery_level';
const orientationCharUuid = 'ef680404-9b35-4933-9b10-52ffa9740042';
const ledCharUuid = 'ef680301-9b35-4933-9b10-52ffa9740042';
const btnCharUuid = 'ef680302-9b35-4933-9b10-52ffa9740042';
const soundConfigCharUuid = 'ef680501-9b35-4933-9b10-52ffa9740042';
const speakerCharUuid = 'ef680502-9b35-4933-9b10-52ffa9740042';

let device, batteryCharacteristic, orientationCharacteristic, ledCharacteristic, btnCharacteristic, soundConfigCharacteristic, speakerCharacteristic;

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

  device.ongattserverdisconnected = disconnect;
  listen();

  connected.style.display = 'block';
  connectButton.style.display = 'none';
  disconnectButton.style.display = 'initial';

  await setUpDevice();
};

const getCharacteristic = async (server, serviceUuid, characteristicUuid) => {
  const service = await server.getPrimaryService(serviceUuid);
  const char = await service.getCharacteristic(characteristicUuid);

  return char;
};

const setUpDevice = async () => {
  //get initial battery value
  const batteryValue = await batteryCharacteristic.readValue();
  batteryStatus.innerText = batteryValue.getInt8(0);

  //turn off when starting up
  await toggleLed(false);

  //turn on speaker
  const dataArray = new Uint8Array(2);
  dataArray[0] = 3 & 0xff;
  dataArray[1] = 1 & 0xff;
  await soundConfigCharacteristic.writeValue(dataArray);
};

const getSampleSound = (sound) => {
  return new Uint8Array([sound & 0xff]);
};

let ledColour = new Uint8Array([1, 0, 0, 255]);

let lightsaberOn = false;
const toggleLed = async (toggle) => {
  if (toggle) {
    await ledCharacteristic.writeValue(ledColour);
    await speakerCharacteristic.writeValue(getSampleSound(0));
    lightsaberOn = true;
    control.style.display = 'block';
    off.style.display = 'none';
  } else {
    await ledCharacteristic.writeValue(new Uint8Array([0]));
    await speakerCharacteristic.writeValue(getSampleSound(1));
    lightsaberOn = false;
    control.style.display = 'none';
    off.style.display = 'block';
  }
};

const listen = () => {
  batteryCharacteristic.addEventListener('characteristicvaluechanged', (evt) => {
    const value = evt.target.value.getInt8(0);
    batteryStatus.innerText = value;
  });
  batteryCharacteristic.startNotifications();

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

  btnCharacteristic.addEventListener('characteristicvaluechanged', (evt) => {
    const value = evt.target.value.getInt8(0);
    toggleLed(value);
  });
  btnCharacteristic.startNotifications();
};

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
