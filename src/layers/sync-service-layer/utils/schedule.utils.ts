import { Schedule, ScheduleByChannel } from "../types/common.types";
import { SchemaSchedule } from "../types/common.types";

export const getHourInSeconds = (hour: string) => {
  const initHour = new Date(`01/01/2001 00:00`);
  const targetHour = new Date(`01/01/2001 ${hour}`);
  const initTime = initHour.getTime();
  const targetTime = targetHour.getTime();
  const diff = targetTime - initTime;
  return diff / 1000;
};

export const transformStoreSchedules = (
  schedules: Schedule[],
  channels: string[],
  storeId: string
) => {
  const newSchedules: SchemaSchedule[] = [];
  channels.forEach(channel => {
    schedules.forEach(schedule => {
      const { day, startDate, endDate } = schedule;
      const newSchedule = {
        day,
        catalogueId: `${storeId}#${channel}`,
        from: getHourInSeconds(schedule.startTime),
        to: getHourInSeconds(schedule.endTime),
        startDate,
        endDate
      };
      newSchedules.push(newSchedule);
    });
  });

  return newSchedules;
};

export const transformStoreSchedulesByChannel = (
  scheduleByChannel: ScheduleByChannel[],
  storeId: string
) => {
  const newSchedules: SchemaSchedule[] = [];
  scheduleByChannel.forEach(scheduleByChannel => {
    const { channelId, schedules } = scheduleByChannel;
    schedules.forEach(schedule => {
      const { day, startDate, endDate } = schedule;
      const newSchedule = {
        day,
        catalogueId: `${storeId}#${channelId}`,
        from: getHourInSeconds(schedule.startTime),
        to: getHourInSeconds(schedule.endTime),
        startDate,
        endDate
      };
      newSchedules.push(newSchedule);
    });
  });

  return newSchedules;
};

export const transformSchedules = (
  schedules: Schedule[],
  storesId: string[],
  channelId: string
) => {
  const newSchedules: SchemaSchedule[] = [];
  storesId.forEach(storeId => {
    schedules.forEach(schedule => {
      const { day, startDate, endDate } = schedule;
      const newSchedule = {
        day,
        catalogueId: `${storeId}#${channelId}`,
        from: getHourInSeconds(schedule.startTime),
        to: getHourInSeconds(schedule.endTime),
        startDate,
        endDate
      };
      newSchedules.push(newSchedule);
    });
  });
};
