import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

function timeToMinutes(value) {
  const [hours, minutes] = String(value || "").split(":").map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function validateShift(shift) {
  if (!shift?.name || !shift?.startTime || !shift?.endTime) {
    throw new Error("Invalid company shift configuration");
  }
  const start = timeToMinutes(shift.startTime);
  const end = timeToMinutes(shift.endTime);
  if (start === null || end === null || start === end) {
    throw new Error(`Invalid time configuration for shift ${shift.name}`);
  }
}

function isOvernightShift(shift) {
  if (shift.crossesMidnight === true) return true;
  return timeToMinutes(shift.endTime) <= timeToMinutes(shift.startTime);
}

export function getShiftRangeForDate({ shift, shiftDate, timezoneName }) {
  validateShift(shift);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(shiftDate || ""))) {
    throw new Error("shiftDate must use YYYY-MM-DD format");
  }

  const zone = timezoneName || "Asia/Colombo";
  const overnight = isOvernightShift(shift);
  const startLocal = dayjs.tz(`${shiftDate} ${shift.startTime}`, "YYYY-MM-DD HH:mm", zone);
  const endDate = overnight
    ? dayjs.tz(shiftDate, "YYYY-MM-DD", zone).add(1, "day").format("YYYY-MM-DD")
    : shiftDate;
  const endLocal = dayjs.tz(`${endDate} ${shift.endTime}`, "YYYY-MM-DD HH:mm", zone);

  if (!startLocal.isValid() || !endLocal.isValid() || startLocal.valueOf() >= endLocal.valueOf()) {
    throw new Error(`Unable to calculate time range for shift ${shift.name}`);
  }

  return {
    shift: shift.name,
    shiftDate,
    timezone: zone,
    fromTime: startLocal.toISOString(),
    toTime: endLocal.toISOString(),
    fromMs: startLocal.valueOf(),
    toMs: endLocal.valueOf(),
    startLocal: startLocal.format(),
    endLocal: endLocal.format(),
    crossesMidnight: overnight,
  };
}

export function getCurrentCompanyShift({ shifts, timezoneName, now = new Date() }) {
  const enabledShifts = Array.isArray(shifts) ? shifts.filter((shift) => shift.enabled !== false) : [];
  if (!enabledShifts.length) throw new Error("No enabled company shifts are configured");

  const current = dayjs(now).tz(timezoneName || "Asia/Colombo");
  const currentMinutes = current.hour() * 60 + current.minute();

  for (const shift of enabledShifts) {
    validateShift(shift);
    const start = timeToMinutes(shift.startTime);
    const end = timeToMinutes(shift.endTime);
    const overnight = isOvernightShift(shift);
    let matches = false;
    let shiftDate = current.format("YYYY-MM-DD");

    if (overnight) {
      matches = currentMinutes >= start || currentMinutes < end;
      if (matches && currentMinutes < end) {
        shiftDate = current.subtract(1, "day").format("YYYY-MM-DD");
      }
    } else {
      matches = currentMinutes >= start && currentMinutes < end;
    }

    if (matches) {
      return getShiftRangeForDate({ shift, shiftDate, timezoneName: timezoneName || "Asia/Colombo" });
    }
  }

  throw new Error("The current time does not match any configured shift");
}

export function resolveCompanyShift({ shifts, timezoneName, shiftName, shiftDate }) {
  if (!shiftName) {
    return getCurrentCompanyShift({ shifts, timezoneName });
  }

  const shift = (Array.isArray(shifts) ? shifts : []).find(
    (item) => item.enabled !== false && item.name === shiftName
  );

  if (!shift) throw new Error(`Shift not found: ${shiftName}`);
  if (!shiftDate) throw new Error("shiftDate is required when selecting a shift");

  return getShiftRangeForDate({ shift, shiftDate, timezoneName });
}
