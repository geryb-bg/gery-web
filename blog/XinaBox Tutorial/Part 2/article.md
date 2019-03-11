# Playing with XinaBox Part 2

![header logo](images/header.jpg "")

In [part one](https://medium.com/@gerybbg/playing-with-xinabox-part-1-cfb742b676e7) of this tutorial series we created a temperature sensor. Although this little thing that we built is pretty cool, we have pretty much built a fancy thermometer. What's cooler than a fancy thermometer? Well, how about a fancy thermometer that is connected to the internet?

> One thing to note, for part 2 you are not necessarily limited to having the XinaBox components. You can achieve the same thing with a [ESP32](https://www.espressif.com/en/products/hardware/esp32/overview), [BME680](https://www.bosch-sensortec.com/bst/products/all_products/bme680) and an [OLED Display](http://www.solomon-systech.com/en/product/display-ic/oled-driver-controller/ssd1306/).

### What you will need
- The XinaBox [device](https://medium.com/@gerybbg/playing-with-xinabox-part-1-cfb742b676e7) we built in part 1
- A [Google Cloud Platform](https://console.cloud.google.com) account
- [Node.js](https://nodejs.org/en/) installed on your computer (_Optional if you would like to run the app that reads the data from GCP IoT Core_)

### Connecting to WiFi
The first thing we need to do is connect our core programming chip to the internet. To do that we need to add some changes to our code.

- First we will include the WiFi library like this `#include <WiFi.h>`
- Next we need to define the SSID and password of the network we will be connecting to:
  ```c
  #define WIFI_SSID "My SSID"
  #define WIFI_PASSWORD "My password"
  ```
- And now we can connect to the WiFi with this code:
  ```c
  void initWifi() {
    digitalWrite(RED_PIN, HIGH);
    OD01.println("Connecting to:");
    OD01.println(WIFI_SSID);

    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    while (WiFi.status() != WL_CONNECTED)
    {
      OD01.println("Retry in 5 secs");
      WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
      delay(5000);
    }

    digitalWrite(RED_PIN, LOW);
    OD01.println("Connected to WiFi");
  }
  ```

This method needs to be called from inside the `setup()` method. It attempts to connect to the internet and if it does not succeed for any reason (for example the chip is too far away from the router) it tries again after 5 seconds.

In order to be able to upload data to the cloud our core chip needs to have the correct timestamp. The CW02 (and it's ESP32 equivalent) can not keep time, however, when they are connected to a WiFi network a time can be set on them. To do this we need to add the following method and call it right after `initWifi()` in the `setup()` method.

```c
void syncTime() {
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  while (time(nullptr) < 1510644967) {
    delay(10);
  }
}
```

Upload this code to your device to make sure you can connect to the internet.

### Sending data to the cloud
Now we can connect to the cloud and send data there. In this case we will be using Google Cloud Platform IoT Core.

There are two ways to setup your devices in GCP IoT Core, one is by using the [gcloud SDK](https://cloud.google.com/sdk/) which allows you to do everything via command line. The other is by doing it in the online console, or as I like to call it the "clicky" way. In this tutorial we will do everything the "clicky" way.

- Open up [GCP](https://console.cloud.google.com/) and log in
- Create a new project
- From the side menu click on _IoT Core_, this will prompt you to enable IoT Core API
- Once enabled it will prompt you to create a device registry. When creating a device registry you will also need to create to PubSub topics, one for telemetry data and one for state data. Although you can use the same topic for both of these, it is a good idea to keep them separate.
- After this is all done you are ready to add devices to your registry. In order to create a device you will need a public/private key pair to secure the communication between your device and the cloud. For this example we will be using an Elliptic Curve (EC) public/private key pair. To generate these run the following two commands in your terminal:
```
openssl ecparam -genkey -name prime256v1 -noout -out my_private_key.pem
openssl ec -in my_private_key.pem -pubout -out my_public_key.pem
```
- Now you can create the device, remember to name your device something meaningful as this can not change once it has been created. You will also have to choose *ES256* as your algorithm and copy the entire public key including the `BEGIN PUBLIC KEY` and `END PUBLIC KEY` parts.

Before we can get back to the code, we will need to install a few libraries. Go to Sketch-Include Library-Manage Libraries... and search for and install the following:

- [Google Cloud IoT Core JWT](https://github.com/GoogleCloudPlatform/google-cloud-iot-arduino): used for authenticating our devices using JSON web tokens.
- [PubSubClient](https://github.com/knolleary/pubsubclient): This is used by the library above to communicate with IoT Core.
- [Buffered Streams](https://github.com/paulo-raca/ArduinoBufferedStreams): This is also used by the Google Cloud library for communicating with IoT Core.
- [MQTT](https://github.com/256dpi/arduino-mqtt): This is used to create a client and send data using the MQTT protocol to IoT Core.

And now, we can finally write some more code:

- Starting with some configuration, define the following replacing all of the relevant properties:
  ```c
  const char *project_id = "my-project";
  const char *location = "europe-west1";
  const char *registry_id = "my-registry";
  const char *device_id = "my-device";

  const char *private_key_str =
      "00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:"
      "00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:"
      "00:00";

  const char *root_cert =
      "-----BEGIN CERTIFICATE-----\n"
      "MIIEXDCCA0SgAwIBAgINAeOpMBz8cgY4P5pTHTANBgkqhkiG9w0BAQsFADBMMSAw\n"
      "HgYDVQQLExdHbG9iYWxTaWduIFJvb3QgQ0EgLSBSMjETMBEGA1UEChMKR2xvYmFs\n"
      "U2lnbjETMBEGA1UEAxMKR2xvYmFsU2lnbjAeFw0xNzA2MTUwMDAwNDJaFw0yMTEy\n"
      "MTUwMDAwNDJaMFQxCzAJBgNVBAYTAlVTMR4wHAYDVQQKExVHb29nbGUgVHJ1c3Qg\n"
      "U2VydmljZXMxJTAjBgNVBAMTHEdvb2dsZSBJbnRlcm5ldCBBdXRob3JpdHkgRzMw\n"
      "ggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDKUkvqHv/OJGuo2nIYaNVW\n"
      "XQ5IWi01CXZaz6TIHLGp/lOJ+600/4hbn7vn6AAB3DVzdQOts7G5pH0rJnnOFUAK\n"
      "71G4nzKMfHCGUksW/mona+Y2emJQ2N+aicwJKetPKRSIgAuPOB6Aahh8Hb2XO3h9\n"
      "RUk2T0HNouB2VzxoMXlkyW7XUR5mw6JkLHnA52XDVoRTWkNty5oCINLvGmnRsJ1z\n"
      "ouAqYGVQMc/7sy+/EYhALrVJEA8KbtyX+r8snwU5C1hUrwaW6MWOARa8qBpNQcWT\n"
      "kaIeoYvy/sGIJEmjR0vFEwHdp1cSaWIr6/4g72n7OqXwfinu7ZYW97EfoOSQJeAz\n"
      "AgMBAAGjggEzMIIBLzAOBgNVHQ8BAf8EBAMCAYYwHQYDVR0lBBYwFAYIKwYBBQUH\n"
      "AwEGCCsGAQUFBwMCMBIGA1UdEwEB/wQIMAYBAf8CAQAwHQYDVR0OBBYEFHfCuFCa\n"
      "Z3Z2sS3ChtCDoH6mfrpLMB8GA1UdIwQYMBaAFJviB1dnHB7AagbeWbSaLd/cGYYu\n"
      "MDUGCCsGAQUFBwEBBCkwJzAlBggrBgEFBQcwAYYZaHR0cDovL29jc3AucGtpLmdv\n"
      "b2cvZ3NyMjAyBgNVHR8EKzApMCegJaAjhiFodHRwOi8vY3JsLnBraS5nb29nL2dz\n"
      "cjIvZ3NyMi5jcmwwPwYDVR0gBDgwNjA0BgZngQwBAgIwKjAoBggrBgEFBQcCARYc\n"
      "aHR0cHM6Ly9wa2kuZ29vZy9yZXBvc2l0b3J5LzANBgkqhkiG9w0BAQsFAAOCAQEA\n"
      "HLeJluRT7bvs26gyAZ8so81trUISd7O45skDUmAge1cnxhG1P2cNmSxbWsoiCt2e\n"
      "ux9LSD+PAj2LIYRFHW31/6xoic1k4tbWXkDCjir37xTTNqRAMPUyFRWSdvt+nlPq\n"
      "wnb8Oa2I/maSJukcxDjNSfpDh/Bd1lZNgdd/8cLdsE3+wypufJ9uXO1iQpnh9zbu\n"
      "FIwsIONGl1p3A8CgxkqI/UAih3JaGOqcpcdaCIzkBaR9uYQ1X4k2Vg5APRLouzVy\n"
      "7a8IVk6wuy6pm+T7HT4LY8ibS5FEZlfAFLSW8NwsVz9SBK2Vqn1N0PIMn5xA6NZV\n"
      "c7o835DLAFshEWfC7TIe3g==\n"
      "-----END CERTIFICATE-----\n";
  ```
- To get the private key string run the command `openssl ec -in my_private_key.pem -noout -text` in the folder where you created your keys and copy the private key part. It should be the exact same length as the one in the example above.
- To get the root cert run the command `openssl s_client -showcerts -connect mqtt.googleapis.com:8883` and copy the certificate.
- Next we need to include some libraries and define some variables:
  ```c
  #include <MQTT.h>
  #include <CloudIoTCore.h>
  #include <WiFi.h>
  #include <WiFiClientSecure.h>

  WiFiClientSecure *netClient;
  MQTTClient *mqttClient;
  CloudIoTCoreDevice *device;
  unsigned long iss = 0;
  String jwt;
  ```
- In the setup method, after we connect to the internet and synchronize the time we need to start the MQTT client:
  ```c
  void initCloudIoT() {
    device = new CloudIoTCoreDevice(
        project_id, location, registry_id, device_id, 
        private_key_str);

    netClient = new WiFiClientSecure();
    mqttClient = new MQTTClient(512);
    mqttClient->begin("mqtt.googleapis.com", 8883, *netClient);
    OD01.println("MQTT started");
  }
  ```
- Then inside our loop method we need to do two things. Check if we are connected to the MQTT client and if not connect to it. After that we can publish the temperature data to MQTT. We do this by replacing our `loop()` method with the following:
  ```c
  void loop() {
    if (!mqttClient->connected()) {
      digitalWrite(RED_PIN, HIGH);
      if (WiFi.status() != WL_CONNECTED) {
        initWifi();
      }
      mqttConnect();
      digitalWrite(RED_PIN, LOW);
    }

    digitalWrite(GREEN_PIN, HIGH);
    bme680.setForcedMode();
    double temperature = bme680.readTemperature();
    String message = "Temperature " + String(temperature) + "C";
    OD01.println(message);
    mqttClient->publish(device->getEventsTopic(), message);
    digitalWrite(GREEN_PIN, LOW);
    delay(10000);
  }
  ```
- The code above calls a method called `mqttConnect()` which we have not implemented yet. This method connects to MQTT by first creating a JWT and then subscribing to the state (configurations) and telemetry (commands) topics that we created in our IoT Core registry.
  ```c
  void mqttConnect() {
    while (!mqttClient->connect(device->getClientId().c_str(), "unused", getJwt().c_str(), false)) {
      delay(1000);
    }
    OD01.println("Connected to MQTT");
    mqttClient->subscribe(device->getConfigTopic());
    mqttClient->subscribe(device->getCommandsTopic());
  }

  String getJwt() {
    //This checks if the JWT has expired and creates a new one if it has
    if (iss == 0 || time(nullptr) - iss > 3600) {
      iss = time(nullptr);
      jwt = device->createJWT(iss);
    }
    return jwt;
  }
  ```

At this point you can upload the code again and the temperature should be sent over MQTT to your telemetry topic.

> I had a problem here where I was getting an error that said _Multiple libraries were found for "WiFi.h"_, the full error specifies where the multiple libraries are and which one is and is not used. To get rid of the error I deleted the folder that the IDE told me was not being used. I am not sure if this broke something else, but nothing has fallen apart so far.

### Receive data from PubSub topic (Optional)
This last little bit here I marked as optional because it is more for a sanity check to make sure that the data is actually being sent. There are two things you have to do in the online console first, before we get to the code. Open up the [console](https://console.cloud.google.com) and make sure you have the correct project selected:

- From the side navigation click on _IoT Core_, select your registry and then select your telemetry topic. Select _Create subscription_ at the top name your subscription and choose the delivery type as _Pull_.
- From the side navigation go to _IAM & admin_ and select _Service accounts_. From the top menu select _Create service account_. Give your service account a name and a description and grant the _Owner_ role for the project. On the next page, click on _Create key_ and create and download a JSON key.

Once that is done we can write some JavaScript to get our data from the subscription we created, this code looks like this:

```js
const PubSub = require('@google-cloud/pubsub');

const pubsub = new PubSub({
    projectId: 'my-project',
    keyFilename: 'path-to-my-service-account.json'
});
const subscriptionName = 'my-subscription';
const subscription = pubsub.subscription(subscriptionName);

const messageHandler = (message) => {
    console.log(`message received ${message.data}`);
    message.ack();
};

subscription.on(`message`, messageHandler);

process.on('SIGINT', function() {
    console.log('Closing connection. Goodbye!');
    subscription.removeListener('message', messageHandler);
    process.exit();
});
```

Here we are using the Google Cloud PubSub library which you will have to install using npm: `npm install @google-cloud/pubsub`. We are then connecting to the subscription using the service account we created, listening for messages being sent and logging them to the console. You can run this code using Node.js.

### Conclusion

That was quite a lot to get through, if you got lost anywhere along the way checkout [the final code on GitHub](https://github.com/geryb-bg/gery-web/tree/master/blog/XinaBox%20Tutorial/Part%202/code). In part three we'll be going into how we can control the devices from IoT Core so that we could have two separate devices communicating with each other.