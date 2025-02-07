import { ChannelMappings } from "../types/channel.types";
import { Schedule, ScheduleByChannel } from "../types/common.types";
import { getHourInSeconds, transformSchedules } from "../utils/schedule.utils";
import { transformStoreSchedules } from "../utils/schedule.utils";
import { transformStoreSchedulesByChannel } from "../utils/schedule.utils";

// Test for getHourInSeconds function
describe("Unit test for getHourInSeconds function", function () {
  it("verifies successful response", async () => {
    const hour = "00:00";
    const result = getHourInSeconds(hour);
    expect(result).toEqual(0);
  });
});

// Test for transformStoreSchedules function
describe("Unit test for transformStoreSchedules function", function () {
  it("verifies successful response", async () => {
    const schedules: Schedule[] = [
      {
        day: "MONDAY",
        startTime: "00:00",
        endTime: "23:59",
        startDate: "2021-07-01",
        endDate: "2021-07-31"
      }
    ];
    const channels: ChannelMappings[] = [
      {
        id: "channelId",
        externalChannelId: "externalChannelId",
        name: "channelName"
      }
    ];
    const storeId = "storeId";
    const vendorId = "vendorId";
    const result = transformStoreSchedules(
      schedules,
      channels,
      vendorId,
      storeId
    );
    expect(result).toEqual([
      {
        vendorIdStoreIdChannelId: ["vendorId.storeId.channelId"],
        day: "MONDAY",
        from: 0,
        to: 86340,
        startDate: "2021-07-01",
        endDate: "2021-07-31"
      }
    ]);
  });
});

// Test for transformStoreSchedulesByChannel function

describe("Unit test for transformStoreSchedulesByChannel function", function () {
  it("verifies successful response", async () => {
    const scheduleByChannel: ScheduleByChannel[] = [
      {
        channelId: "externalChannelId",
        schedules: [
          {
            day: "MONDAY",
            startTime: "00:00",
            endTime: "23:59",
            startDate: "2021-07-01",
            endDate: "2021-07-31"
          }
        ]
      }
    ];
    const storeId = "storeId";
    const vendorId = "vendorId";
    const channelMappings: ChannelMappings[] = [
      {
        id: "channelId",
        externalChannelId: "externalChannelId",
        name: "channelName"
      }
    ];
    const result = transformStoreSchedulesByChannel(
      scheduleByChannel,
      storeId,
      vendorId,
      channelMappings
    );
    expect(result).toEqual([
      {
        vendorIdStoreIdChannelId: ["vendorId.storeId.channelId"],
        day: "MONDAY",
        from: 0,
        to: 86340,
        startDate: "2021-07-01",
        endDate: "2021-07-31"
      }
    ]);
  });
});

describe("Unit test for transformSchedules function", function () {
  it("verifies successful response", async () => {
    const schedules: Schedule[] = [
      {
        day: "MONDAY",
        startTime: "00:00",
        endTime: "23:59",
        startDate: "2021-07-01",
        endDate: "2021-07-31"
      }
    ];
    const storesId = ["storeId"];
    const channelId = "channelId";
    const vendorId = "vendorId";
    const result = transformSchedules(schedules, storesId, channelId, vendorId);
    expect(result).toEqual([
      {
        vendorIdStoreIdChannelId: ["vendorId.storeId.channelId"],
        day: "MONDAY",
        from: 0,
        to: 86340,
        startDate: "2021-07-01",
        endDate: "2021-07-31"
      }
    ]);
  });
});
