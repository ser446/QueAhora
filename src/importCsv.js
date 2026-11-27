const formats = [
  {origin: "goodreads", title: "Title", author: "Author", required: ["Book Id", "Title", "Author", "Exclusive Shelf"]},
  {origin: "bookmory", title: "Título", author: "Autores", required: ["Título", "Autores", "Estado"]},
];

function readRows(text, separator) {
  const rows = [];
  let row = [], value = "", quoted = false, closedQuote = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        value += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
        closedQuote = true;
      } else {
        value += char;
      }
    } else if (char === separator || char === "\n" || char === "\r") {
      row.push(value);
      value = "";
      closedQuote = false;
      if (char !== separator) {
        if (char === "\r" && text[i + 1] === "\n") i++;
        if (row.some(field => field.trim())) rows.push(row);
        row = [];
      }
    } else if (char === '"' && !closedQuote && !value) {
      quoted = true;
    } else if (!closedQuote) {
      value += char;
    } else {
      throw new Error("El CSV tiene un campo mal cerrado.");
    }
  }
  if (quoted) throw new Error("El CSV tiene un campo entre comillas sin cerrar.");
  row.push(value);
  if (row.some(field => field.trim())) rows.push(row);
  return rows;
}

export function parseLibraryCsv(text) {
  const input = text.replace(/^\uFEFF/, "");
  const headerLine = input.split(/\r\n|\r|\n/, 1)[0];
  const separator = headerLine.split(";").length > headerLine.split(",").length ? ";" : ",";
  const [header = [], ...rows] = readRows(input, separator);
  const columns = header.map(field => field.trim());
  const format = formats.find(({required}) => required.every(field => columns.includes(field)));
  if (!format) throw new Error("Elegí un CSV exportado desde Goodreads o Bookmory.");
  if (new Set(columns).size !== columns.length || rows.some(row => row.length !== columns.length)) {
    throw new Error("El CSV tiene columnas repetidas o filas incompletas.");
  }
  if (!rows.length) throw new Error("El archivo no contiene libros.");

  const {title, author} = format;
  const records = rows.map(row => {
    const datos = Object.fromEntries(columns.map((column, index) => [column, row[index]]));
    return {titulo: datos[title], autor: datos[author], datos};
  });
  return {origin: format.origin, records};
}
