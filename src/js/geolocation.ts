// The position of the device, asked to the browser on an action of the user (never by itself): "Near me" in the
// listings, "My position" in the address inputs. A failure rejects with a message for the user, translated
export function getPosition($gettext: (text: string) => string): Promise<GeolocationCoordinates> {
  if (!navigator.geolocation) {
    return Promise.reject(new Error($gettext('Geolocation is not supported by your browser.')));
  }
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve(coords),
      (error) => reject(new Error(positionError(error, $gettext))),
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 10_000 }
    )
  );
}

export function positionError(error: GeolocationPositionError, $gettext: (text: string) => string) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return $gettext('Location refused. Allow it in the settings of the browser, then try again.');
    case error.POSITION_UNAVAILABLE:
      return $gettext('Position unavailable (weak GPS signal?). Try again outside, or in a few seconds.');
    default:
      return $gettext('The position took too long to come. Try again.');
  }
}
