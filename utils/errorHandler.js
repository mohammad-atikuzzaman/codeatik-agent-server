export const errorHandler = (err, req, res, next) => {
  console.error("Error:", {
    message: err.message,
    stack: err.stack,
    response: err.response?.data
      ? JSON.stringify(err.response.data, null, 2)
      : "N/A",
  });

  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    details: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};
