import axiosInstance from '../axios';

export const loginUser = async (username, password) => {
  const response = await axiosInstance.post('/auth/login', {
    username,
    password,
    expiresInMins: 60, // DummyJSON specific parameter
  });
  return response.data;
};