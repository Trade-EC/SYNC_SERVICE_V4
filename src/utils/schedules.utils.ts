import { OldDay, OldSchedule } from "../types/schedule.types";
import { ScheduleByChannel } from "../types/schedule.types";
import { Store } from "../types/stores.types";

const EVERYDAY: OldDay[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY"
];

const WEEKDAYS: OldDay[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY"
];

export const transformScheduleV4ToSchedule = (
  schedulesByChannel: ScheduleByChannel[],
  storeId: Store["storeId"]
) => {
  const newSchedules: OldSchedule[] = [];

  schedulesByChannel.forEach(scheduleByChannel => {
    const { channelId, schedules } = scheduleByChannel;
    schedules.forEach(schedule => {
      const { dayOfWeek } = schedule;
      const { timePeriods, startDate, endDate } = schedule;
      const [timePeriod] = timePeriods;

      switch (dayOfWeek) {
        case "EVERYDAY":
          EVERYDAY.forEach(day => {
            newSchedules.push({
              day,
              catalogueId: `${storeId}#${channelId}`,
              from: timePeriod.startTime,
              to: timePeriod.endTime
            });
          });
          break;
        case "WEEKDAYS":
          WEEKDAYS.forEach(day => {
            newSchedules.push({
              day,
              catalogueId: `${storeId}#${channelId}`,
              from: timePeriod.startTime,
              to: timePeriod.endTime
            });
          });
          break;
        case "SPECIAL":
          newSchedules.push({
            day: "SPECIAL",
            catalogueId: `${storeId}#${channelId}`,
            startDate: startDate,
            endDate: endDate,
            from: timePeriod.startTime,
            to: timePeriod.endTime
          });
          break;
        default:
          newSchedules.push({
            day: dayOfWeek,
            catalogueId: `${storeId}#${channelId}`,
            from: timePeriod.startTime,
            to: timePeriod.endTime
          });
          break;
      }
    });
  });

  return newSchedules;
};
