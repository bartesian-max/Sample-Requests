function generateCSV() {
    const name = document.getElementById('name').value;
    const address = document.getElementById('address').value;
    const sku = document.getElementById('sku').value;
  
    // Format the CSV content
    const csvContent = `Name,Address,SKU\n${name},${address},${sku}`;
  
    // Trigger the download
    downloadCSV(csvContent);
  }
  
  function downloadCSV(csvContent) {
    // Create a Blob from the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv' });
    
    // Create a link element
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    // Set the download attribute with a filename
    a.setAttribute('href', url);
    a.setAttribute('download', 'sample_request.csv');
    
    // Append the link to the body
    document.body.appendChild(a);
    
    // Programmatically click the link to trigger the download
    a.click();
    
    // Remove the link from the document
    document.body.removeChild(a);
  }
  