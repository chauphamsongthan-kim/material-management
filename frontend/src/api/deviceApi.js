import axiosClient from './axiosClient';

export async function getDevicesByDepartment(departmentId) {
  const response = await axiosClient.get(`/departments/${departmentId}/devices`);

  return response.data;
}

export async function getDeviceById(deviceId) {
  const response = await axiosClient.get(`/devices/${deviceId}`);

  return response.data;
}

export async function addDevice(departmentId, deviceData) {
  const response = await axiosClient.post(
    `/departments/${departmentId}/devices`,
    deviceData
  );

  return response.data;
}

export async function borrowDevice(deviceId, borrowData) {
  const response = await axiosClient.post(
    `/devices/${deviceId}/borrow`,
    borrowData
  );

  return response.data;
}

export async function getActiveBorrows(deviceId) {
  const response = await axiosClient.get(
    `/devices/${deviceId}/active-borrows`
  );

  return response.data;
}

export async function returnDevice(deviceId, returnData) {
  const response = await axiosClient.post(
    `/devices/${deviceId}/return`,
    returnData
  );

  return response.data;
}

export async function getDeviceHistory(deviceId) {
  const response = await axiosClient.get(
    `/devices/${deviceId}/history`
  );

  return response.data;
}

export async function updateDevice(deviceId, deviceData) {
  const response = await axiosClient.put(
    `/devices/${deviceId}`,
    deviceData
  );

  return response.data;
}

export async function deleteDevice(deviceId) {
  const response = await axiosClient.delete(
    `/devices/${deviceId}`
  );

  return response.data;
}

export async function searchDevices(keyword) {
  const response = await axiosClient.get('/devices/search', {
    params: {
      q: keyword,
    },
  });

  return response.data;
}