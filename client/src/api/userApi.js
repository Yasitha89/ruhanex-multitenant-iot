import api from "./api";

export async function getUsers() {
  const response =
    await api.get("/users");

  return response.data;
}

export async function createUser(
  values
) {
  const response =
    await api.post(
      "/users",
      values
    );

  return response.data;
}

export async function updateUser(
  userId,
  values
) {
  const response =
    await api.patch(
      `/users/${userId}`,
      values
    );

  return response.data;
}

export async function resetUserPassword(
  userId,
  password
) {
  const response =
    await api.patch(
      `/users/${userId}/password`,
      {
        password,
      }
    );

  return response.data;
}
