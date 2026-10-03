export function imageFromPickerResult(result) {
  if (!result || result.canceled) return { status: 'canceled' };
  const uri = result.assets?.[0]?.uri;
  if (typeof uri !== 'string' || uri.trim() === '') return { status: 'invalid' };
  return { status: 'selected', uri };
}
