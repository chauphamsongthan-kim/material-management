import axiosClient from './axiosClient';

// Lấy danh sách tất cả các Ban
export async function getDepartments() {
  const response = await axiosClient.get('/departments');

  return response.data;
}