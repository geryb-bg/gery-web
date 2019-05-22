const connectButton = document.getElementById('connectButton');
const disconnectButton = document.getElementById('disconnectButton');

const connect = document.getElementById('connect');

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

disconnectButton.onclick = async () => {
    await device.close();
    
    connected.style.display = 'none';
    connectButton.style.display = 'initial';
    disconnectButton.style.display = 'none';
};