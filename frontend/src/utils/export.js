import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Export to CSV helper
export const exportToCSV = (data, headers, filename) => {
  if (!data || data.length === 0) {
    alert('No data available to export');
    return;
  }

  // Generate CSV rows
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      let val = row[header];
      
      // Handle nested values
      if (header.includes('.')) {
        const parts = header.split('.');
        val = row[parts[0]] ? row[parts[0]][parts[1]] : '';
      }

      // Format date if it is a Date string
      if (val && typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}T/)) {
        val = new Date(val).toLocaleDateString();
      }

      // Escape quotes and double-quote strings to handle commas
      const stringVal = val === null || val === undefined ? '' : String(val);
      const escaped = stringVal.replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  // Create blob and trigger download
  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + csvRows.join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export to PDF helper
export const exportToPDF = (title, headers, dataFields, data, filename) => {
  if (!data || data.length === 0) {
    alert('No data available to export');
    return;
  }

  const doc = new jsPDF();
  
  // Add Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(title, 14, 15);

  // Add Metadata (Timestamp)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

  // Prepare table rows
  const rows = data.map(item => {
    return dataFields.map(field => {
      let val = item[field];
      
      // Handle nested fields (e.g. assignedStaff.name)
      if (field.includes('.')) {
        const parts = field.split('.');
        val = item[parts[0]] ? item[parts[0]][parts[1]] : '';
      }

      // Format date
      if (val && typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}T/)) {
        val = new Date(val).toLocaleDateString();
      }

      return val === null || val === undefined ? '-' : String(val);
    });
  });

  // Render Table
  autoTable(doc, {
    startY: 28,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [59, 130, 246], // Accent primary color
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 8,
      cellPadding: 2
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  // Save PDF
  doc.save(`${filename}.pdf`);
};
