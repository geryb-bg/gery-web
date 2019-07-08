const connectButton = document.getElementById('connectButton');
const disconnectButton = document.getElementById('disconnectButton');
const colourPicker = document.getElementById('colourPicker');
const colourButton = document.getElementById('colourButton');

const connect = document.getElementById('connect');
const deviceHeartbeat = document.getElementById('deviceHeartbeat');

const primaryServiceUuid = '12345678-1234-5678-1234-56789abcdef0';
const heartBeatCharUuid = '12345678-1234-5678-1234-56789abcdef1';
const cmdCharUuid = '12345678-1234-5678-1234-56789abcdef3';

let device, cmdCharacteristic, heartCharacteristic;
connectButton.onclick = async () => {
  device = await navigator.bluetooth.requestDevice({ filters: [{ services: [primaryServiceUuid] }] });
  const server = await device.gatt.connect();
  const service = await server.getPrimaryService(primaryServiceUuid);
  heartCharacteristic = await service.getCharacteristic(heartBeatCharUuid);
  cmdCharacteristic = await service.getCharacteristic(cmdCharUuid);

  device.ongattserverdisconnected = disconnect;
  listen();

  connected.style.display = 'block';
  connectButton.style.display = 'none';
  disconnectButton.style.display = 'initial';
};

const listen = (heartChar) => {
  heartChar.addEventListener('characteristicvaluechanged', (evt) => {
    const value = evt.target.value.getInt16(0, true);
    deviceHeartbeat.innerText = value;
  });
  heartChar.startNotifications();
};

const hexToRgb = (hex) => {
  const r = parseInt(hex.substring(1, 3), 16); //start at 1 to avoid #
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);

  return [r, g, b];
};

colourButton.onclick = async () => {
  const data = new Uint8Array([1, ...hexToRgb(colourPicker.value)]);
  cmdCharacteristic.writeValue(data);
};

disconnectButton.onclick = async () => {
  await device.gatt.disconnect();
  disconnect();
};

const disconnect = () => {
  connected.style.display = 'none';
  connectButton.style.display = 'initial';
  disconnectButton.style.display = 'none';
};