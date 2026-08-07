export const successResponse = (data?: any) => {
  return { success: true, data };
};

export const errorResponse = (code: string, message: string) => {
  return { success: false, error: { code, message } };
};
