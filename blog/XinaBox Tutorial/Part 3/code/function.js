'use strict';
const { google } = require('googleapis');

const projectId = 'Your-Project-Id';
const cloudRegion = 'europe-west1';
const registryId = 'Your-Registry-Id';
const deviceId = 'Your-Device-Id';

exports.DeviceToDeviceFunction = function(event, callback) {
  if (event.data) {
    const record = JSON.parse(Buffer.from(event.data, 'base64').toString());

    google.auth.getClient()
      .then(client => {
        google.options({ auth: client });

        const registryName = `projects/${projectId}/locations/${cloudRegion}/registries/${registryId}`;
        binaryData = Buffer.from(record.temperature.toString()).toString('base64');

        const request = {
          name: `${registryName}/devices/${deviceId}`,
          versionToUpdate: 0,
          binaryData: binaryData
        };
        return google.cloudiot('v1').projects.locations.registries.devices
            .modifyCloudToDeviceConfig(request);
      })
      .then(result => {
        console.log(result);
      });
  }
};
