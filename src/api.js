const DEFAULT_API_URL = "";

const trimTrailingSlash = (value) => value.replace(/\/+$/, "");

export const API_URL = trimTrailingSlash(
  process.env.REACT_APP_API_URL || DEFAULT_API_URL
);

export const getStoredLocalCars = () => {
  try { return JSON.parse(localStorage.getItem('blueseal_custom_cars') || '[]'); } catch { return []; }
};

export const getStoredDeletedIds = () => {
  try { return JSON.parse(localStorage.getItem('blueseal_deleted_ids') || '[]'); } catch { return []; }
};

export const saveLocalCar = (car, isEdit) => {
  const current = getStoredLocalCars();
  const targetId = car._id || car.id;
  let updated;
  if (isEdit && targetId) {
    updated = current.map(c => ((c._id === targetId || c.id === targetId) ? car : c));
  } else {
    updated = [car, ...current.filter(c => c._id !== targetId && c.id !== targetId)];
  }
  localStorage.setItem('blueseal_custom_cars', JSON.stringify(updated));
};

export const removeLocalCar = (carId) => {
  const current = getStoredLocalCars();
  localStorage.setItem('blueseal_custom_cars', JSON.stringify(current.filter(c => c._id !== carId && c.id !== carId)));
  const deletedIds = getStoredDeletedIds();
  if (!deletedIds.includes(carId)) {
    localStorage.setItem('blueseal_deleted_ids', JSON.stringify([...deletedIds, carId]));
  }
};

export const mergeCarsWithLocal = (serverCars = []) => {
  const localCars = getStoredLocalCars();
  const deletedIds = getStoredDeletedIds();
  const combined = [...localCars];
  (Array.isArray(serverCars) ? serverCars : []).forEach(sc => {
    const scId = sc._id || sc.id;
    if (!combined.some(lc => (lc._id === scId || lc.id === scId))) {
      combined.push(sc);
    }
  });
  return combined.filter(c => !deletedIds.includes(c._id || c.id));
};
