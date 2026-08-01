function pad(value) {
  return String(value).padStart(2, "0");
}

function dateString(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function getCurrentShift(input = new Date()) {
  const now = new Date(input);
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const h = now.getHours();

  let shift;
  let shiftDate;
  let from;
  let to;

  if (h >= 6 && h < 14) {
    shift = "06-14";
    shiftDate = dateString(now);
    from = new Date(y, m, d, 6, 0, 0, 0);
    to = new Date(y, m, d, 14, 0, 0, 0);
  } else if (h >= 14 && h < 22) {
    shift = "14-22";
    shiftDate = dateString(now);
    from = new Date(y, m, d, 14, 0, 0, 0);
    to = new Date(y, m, d, 22, 0, 0, 0);
  } else if (h >= 22) {
    shift = "22-06";
    shiftDate = dateString(now);
    from = new Date(y, m, d, 22, 0, 0, 0);
    to = new Date(y, m, d + 1, 6, 0, 0, 0);
  } else {
    shift = "22-06";
    const previous = new Date(y, m, d - 1);
    shiftDate = dateString(previous);
    from = new Date(y, m, d - 1, 22, 0, 0, 0);
    to = new Date(y, m, d, 6, 0, 0, 0);
  }

  return {
    shift,
    shiftDate,
    fromTime: from.toISOString(),
    toTime: to.toISOString(),
  };
}
