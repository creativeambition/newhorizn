export const determineBookingStatus = (checkIn: string, checkOut: string, currentStatus?: string) => {
  if (currentStatus === "pending" || currentStatus === "declined") {
    return currentStatus;
  }

  const now = new Date();
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  if (now < checkInDate) {
    return "upcoming";
  } else if (now > checkOutDate) {
    return "completed";
  } else {
    return "active";
  }
};
