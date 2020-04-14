const axios = require("axios");

module.exports = async function(context, req) {
  try {
    const statusResponse = await axios.get(
      `http://loadshedding.eskom.co.za/LoadShedding/GetStatus`
    );

    const status = 4; //statusResponse.data;

    let returnData = {
      stage: 0,
      loadshedding: false,
      timeStarted: "00:00",
      timeEnded: "00:00",
      isHigher: false
    };

    switch (status) {
      case 99:
        context.res = {
          status: 400,
          body: error
        };
        break;
      case 2:
      case 3:
      case 4:
      case 5:
        returnData.stage = status - 1;
        break;
      default:
        returnData.stage = 4;
        returnData.isHigher = true;
        break;
    }

    const scheduleResponse = await axios.get(
      `http://loadshedding.eskom.co.za/LoadShedding/GetScheduleM/1065491/${returnData.stage}/_/1`
    );
    returnData.newStuff = scheduleResponse.data;

    context.res = {
      body: returnData.newStuff
    };
  } catch (error) {
    context.res = {
      status: 400,
      body: error
    };
  }
};
