const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

function getCurrentTime(time = null) {
  dayjs.extend(utc);
  dayjs.extend(timezone);
  if (time === null) {
    return dayjs().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss');
  }

  return dayjs(time).tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss');
}

function addMinuteToTime(time, minute) {
  dayjs.extend(utc);
  dayjs.extend(timezone);
  return dayjs(time).add(minute, 'minute').format('YYYY-MM-DD HH:mm:ss');
}

function getCompareTime(time1, time2, unit = null) {
  dayjs.extend(utc);
  dayjs.extend(timezone);
  const date1 = dayjs(time1).tz('Asia/Jakarta');
  const date2 = dayjs(time2).tz('Asia/Jakarta');
  return (unit == null ? date1.diff(date2) : date1.diff(date2, unit, true));
}

function getTimeFromUnixTime(unixTime) {
  dayjs.extend(utc);
  dayjs.extend(timezone);
  return dayjs(Number(unixTime)).tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss');
}

function convertUnixTime(unixTime) {
  dayjs.extend(utc);
  dayjs.extend(timezone);
  return dayjs.unix(Number(unixTime)).tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss');
}

module.exports = {
  getCurrentTime,
  addMinuteToTime,
  getCompareTime,
  getTimeFromUnixTime,
  convertUnixTime,
};
