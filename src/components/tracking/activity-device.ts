export function distinctDeviceName(deviceName: string | undefined, vendor: string, vendorLabel: string) {
  const name = deviceName?.trim();
  if (!name) {
    return undefined;
  }

  const normalizedName = name.toLowerCase();
  return normalizedName === vendor.toLowerCase() || normalizedName === vendorLabel.trim().toLowerCase()
    ? undefined
    : name;
}
