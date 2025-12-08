// Utilidades para trabajar con archivos CSV

export function parseCSV(csvText: string): string[][] {
  const lines = csvText.split('\n');
  const result: string[][] = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    const row: string[] = [];
    let currentField = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (insideQuotes && line[i + 1] === '"') {
          // Comillas dobles escapadas
          currentField += '"';
          i++;
        } else {
          // Toggle estado de comillas
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        // Fin del campo
        row.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }

    // Agregar último campo
    row.push(currentField.trim());
    result.push(row);
  }

  return result;
}

export function generateCSV(data: string[][]): string {
  return data
    .map((row) =>
      row
        .map((field) => {
          // Escapar comillas y envolver en comillas si contiene coma o comillas
          const needsQuotes = field.includes(',') || field.includes('"') || field.includes('\n');
          const escaped = field.replace(/"/g, '""');
          return needsQuotes ? `"${escaped}"` : field;
        })
        .join(',')
    )
    .join('\n');
}

export function downloadCSV(data: string[][], filename: string) {
  const csv = generateCSV(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
