# Ruhanex Dynamic Shift Dashboard Update

This package makes Express calculate the current shift, shift date, `fromTime`, and `toTime` from the company profile's saved timezone and enabled shifts.

## Install

Run inside the server folder:

```bash
npm install dayjs
```

## Copy these files

- `server/src/utils/shiftTime.js`
- `server/src/controllers/dashboardController.js`
- `client/src/api/dashboardApi.js`
- `client/src/pages/dashboards/ProductionDashboard.jsx`

React now sends only `deviceId` for the live dashboard. Express calculates the current shift range and sends it to Node-RED.

For an overnight 22:00-06:00 shift, at 03:00 on August 2 in Asia/Colombo, Express returns `shiftDate: 2026-08-01`, `fromTime: 2026-08-01T16:30:00.000Z`, and `toTime: 2026-08-02T00:30:00.000Z`.
