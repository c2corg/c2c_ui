const sizes = ['SI', 'MI', 'BI'];

export const filenames = (content) => {
  return [content.filename, ...sizes.map((size) => content.filename.replace('.', `${size}.`).replace('.svg', '.jpg'))];
};
