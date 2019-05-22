const connectButton = document.getElementById("connectButton");
const disconnectButton = document.getElementById("disconnectButton");
const colourPicker = document.getElementById("colourPicker");
const colourButton = document.getElementById("colourButton");

const connect = document.getElementById("connect");
const deviceHeartbeat = document.getElementById("deviceHeartbeat");
const deviceButtonPressed = document.getElementById("deviceButtonPressed");

let device;
connectButton.onclick = async () => {
  device = await navigator.usb.requestDevice({
    filters: [{ vendorId: 0x2fe3 }]
  });

  await device.open();
  await device.selectConfiguration(1);
  await device.claimInterface(0);

  connected.style.display = "block";
  connectButton.style.display = "none";
  disconnectButton.style.display = "initial";
  listen();
};

const listen = async () => {
  const result = await device.transferIn(3, 64);

  const decoder = new TextDecoder();
  const message = decoder.decode(result.data);

  const messageParts = message.split(" = ");
  if (messageParts[0] === "Count") {
    deviceHeartbeat.innerText = messageParts[1];
  } else if (messageParts[0] === "Button" && messageParts[1] === "1") {
    deviceButtonPressed.innerText = new Date().toLocaleString("en-ZA", {
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
  }
  listen();
};

const hexToRgb = hex => {
  const r = parseInt(hex.substring(1, 3), 16); //start at 1 to avoid #
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);

  return [r, g, b];
};

colourButton.onclick = async () => {
  const data = new Uint8Array([1, ...hexToRgb(colourPicker.value)]);
  await device.transferOut(2, data);
};

disconnectButton.onclick = async () => {
  await device.close();

  connected.style.display = "none";
  connectButton.style.display = "initial";
  disconnectButton.style.display = "none";
};
