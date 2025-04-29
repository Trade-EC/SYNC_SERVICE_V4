import { sortObjectByKeys } from "./common.utils";
import { ChannelMappings } from "../types/channel.types";
import {
  GroupedSchedule,
  Schedule,
  ScheduleByChannel,
  SchemaSchedule
} from "../types/common.types";

/**
 *
 * @param hour
 * @description Get hour in seconds
 * @returns number
 */
export const getHourInSeconds = (hour: string) => {
  const initHour = new Date(`01/01/2001 00:00`);
  const targetHour = new Date(`01/01/2001 ${hour}`);
  const initTime = initHour.getTime();
  const targetTime = targetHour.getTime();
  const diff = targetTime - initTime;
  return diff / 1000;
};

/**
 *
 * @param schedules
 * @param channels
 * @param storeId
 * @description Transform store schedules into SchemaSchedule
 * @returns {SchemaSchedule[]}
 */
export const transformStoreSchedules = (
  schedules: Schedule[],
  channelsMappings: ChannelMappings[],
  vendorId: string,
  storeId: string
) => {
  const newSchedules: SchemaSchedule[] = [];
  const vendorIdStoreIdChannelId: string[] = [];
  channelsMappings.forEach(channel => {
    vendorIdStoreIdChannelId.push(`${vendorId}.${storeId}.${channel.id}`);
  });
  schedules.forEach(schedule => {
    const { day, startDate, endDate } = schedule;
    const newSchedule = {
      vendorIdStoreIdChannelId,
      day,
      from: getHourInSeconds(schedule.startTime),
      to: getHourInSeconds(schedule.endTime),
      startDate,
      endDate,
      fromTime: schedule.startTime,
      toTime: schedule.endTime
    };
    newSchedules.push(newSchedule);
  });

  return groupSchedules(newSchedules);
};

/**
 *
 * @param scheduleByChannel
 * @param storeId
 * @description Transform store schedules by channel into SchemaSchedule
 * @returns SchemaSchedule[]
 */
export const transformStoreSchedulesByChannel = (
  scheduleByChannel: ScheduleByChannel[],
  storeId: string,
  vendorId: string,
  channelMappings: ChannelMappings[]
) => {
  const newSchedules: SchemaSchedule[] = [];
  scheduleByChannel.forEach(scheduleByChannel => {
    const { channelId: scheduleChannelId, schedules } = scheduleByChannel;
    const filterChannelMappings = channelMappings.filter(
      vendorChannel => vendorChannel.externalChannelId === scheduleChannelId
    );
    if (!filterChannelMappings.length) {
      throw new Error(`Channel ${scheduleChannelId} not found`);
    }
    filterChannelMappings.forEach(channel => {
      const { externalChannelId, id } = channel;
      const channelId = id ?? externalChannelId;
      const vendorIdStoreIdChannelId = [`${vendorId}.${storeId}.${channelId}`];

      schedules.forEach(schedule => {
        const { day, startDate, endDate } = schedule;
        const newSchedule = {
          vendorIdStoreIdChannelId,
          day,
          from: getHourInSeconds(schedule.startTime),
          to: getHourInSeconds(schedule.endTime),
          startDate,
          endDate,
          fromTime: schedule.startTime,
          toTime: schedule.endTime
        };
        newSchedules.push(newSchedule);
      });
    });
  });

  return groupSchedules(newSchedules);
};

/**
 *
 * @param schedules
 * @param storesId
 * @param channelId
 * @description Transform schedules into SchemaSchedule
 * @returns {SchemaSchedule[]}
 */
export const transformSchedules = (
  schedules: Schedule[],
  storesId: string[],
  channelId: string,
  vendorId: string
) => {
  const newSchedules: SchemaSchedule[] = [];
  const vendorIdStoreIdChannelId = storesId.map(
    storeId => `${vendorId}.${storeId}.${channelId}`
  );
  schedules.forEach(schedule => {
    const { day, startDate, endDate } = schedule;
    const newSchedule = {
      vendorIdStoreIdChannelId,
      day,
      from: getHourInSeconds(schedule.startTime),
      to: getHourInSeconds(schedule.endTime),
      startDate,
      endDate,
      fromTime: schedule.startTime,
      toTime: schedule.endTime
    };
    newSchedules.push(newSchedule);
  });

  return groupSchedules(newSchedules);
};

// Función para comparar las propiedades necesarias, incluyendo vendorIdStoreIdChannelId
const isSameSchedule = (
  a: Pick<
    SchemaSchedule,
    "from" | "to" | "startDate" | "endDate" | "vendorIdStoreIdChannelId"
  >,
  b: Pick<
    SchemaSchedule,
    "from" | "to" | "startDate" | "endDate" | "vendorIdStoreIdChannelId"
  >
): boolean => {
  // Comparar vendorIdStoreIdChannelId
  const isSameVendor =
    a.vendorIdStoreIdChannelId.join(",") ===
    b.vendorIdStoreIdChannelId.join(",");

  // Comparar horarios
  const isSameTime =
    a.from === b.from &&
    a.to === b.to &&
    a.startDate === b.startDate &&
    a.endDate === b.endDate;

  return isSameVendor && isSameTime;
};

const groupSchedules = (data: SchemaSchedule[]): GroupedSchedule[] => {
  const groupedSchedules: GroupedSchedule[] = [];

  // Arrow function para encontrar un grupo existente
  const findGroup = (schedule: SchemaSchedule): GroupedSchedule | undefined =>
    groupedSchedules.find(group =>
      isSameSchedule(
        {
          ...group.schedule,
          vendorIdStoreIdChannelId: group.vendorIdStoreIdChannelId
        },
        schedule
      )
    );

  data.forEach(schedule => {
    const existingGroup = findGroup(schedule);

    if (existingGroup) {
      if (!existingGroup.schedule.days.includes(schedule.day)) {
        existingGroup.schedule.days.push(schedule.day);
      }
      schedule.vendorIdStoreIdChannelId.forEach(id => {
        if (!existingGroup.vendorIdStoreIdChannelId.includes(id)) {
          existingGroup.vendorIdStoreIdChannelId.push(id);
        }
      });
    } else {
      groupedSchedules.push({
        vendorIdStoreIdChannelId: [...schedule.vendorIdStoreIdChannelId], // Array plano
        schedule: {
          days: [schedule.day],
          from: schedule.from,
          to: schedule.to,
          fromTime: schedule.fromTime,
          toTime: schedule.toTime,
          startDate: schedule.startDate,
          endDate: schedule.endDate
        }
      });
    }
  });

  return mergeGroupSchedules(groupedSchedules);
};

const mergeGroupSchedules = (
  schedules: GroupedSchedule[]
): GroupedSchedule[] => {
  const mergedSchedules: GroupedSchedule[] = [];

  schedules.forEach(schedule => {
    schedule.schedule.days = schedule.schedule.days.sort();
    const sortSchedule = sortObjectByKeys(schedule.schedule);
    const hashSchedule = JSON.stringify(sortSchedule);
    const findSchedule = mergedSchedules.find(
      mergedSchedule => JSON.stringify(mergedSchedule.schedule) === hashSchedule
    );
    if (findSchedule) {
      schedule.vendorIdStoreIdChannelId.forEach(id => {
        if (!findSchedule.vendorIdStoreIdChannelId.includes(id)) {
          findSchedule.vendorIdStoreIdChannelId.push(id);
        }
      });
    } else {
      mergedSchedules.push({
        vendorIdStoreIdChannelId: schedule.vendorIdStoreIdChannelId,
        schedule: sortSchedule
      });
    }
  });

  return mergedSchedules;
};
