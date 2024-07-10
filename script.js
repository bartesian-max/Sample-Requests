let skuData = { "Canada": [], "United States": [] };

$(document).ready(function() {
  loadSkuData();
  $('#country').change(updateCountrySpecificFields);
  $('#sampleType').val('144 Marketing Samples'); // Set default sample type
  $('#country').val('United States'); // Set default country
  $('#country').trigger('change'); // Initialize fields based on default country
});

function loadSkuData() {
  Papa.parse('SKUs.csv', {
    download: true,
    header: true,
    complete: function(results) {
      results.data.forEach(row => {
        if (row.DisplayNameUSA && row.ItemCodeUSA) {
          skuData["United States"].push({ DisplayName: row.DisplayNameUSA, ItemCode: row.ItemCodeUSA });
        }
        if (row.DisplayNameCanada && row.ItemCodeCanada) {
          skuData["Canada"].push({ DisplayName: row.DisplayNameCanada, ItemCode: row.ItemCodeCanada });
        }
      });
      updateCountrySpecificFields(); // Ensure initial SKU options are loaded
    }
  });
}

function updateCountrySpecificFields() {
  const country = $('#country').val();
  updateLocationAndShippingMethod(country);
  updateSkuOptions(country);
}

function updateLocationAndShippingMethod(country) {
  let location, shippingMethods;

  if (country === 'Canada') {
    location = 'Shipbob - Brampton FC';
    shippingMethods = ['Shopify Standard'];
  } else if (country === 'United States') {
    location = 'Tagg - Bolingbrook FC';
    shippingMethods = ['FEDEXG', 'FEDEX2D', 'FEDEXND'];
  }

  // Update shipping method dropdown
  $('#shippingMethod').empty();
  shippingMethods.forEach(method => {
    $('#shippingMethod').append(`<option value="${method}">${method}</option>`);
  });
}

function updateSkuOptions(country) {
  const skus = skuData[country] || [];
  $('#skuList').empty();
  addSkuRow(); // Add an initial row immediately when the country changes
}

function addSkuRow() {
  const country = $('#country').val();
  const skus = skuData[country] || [];

  const skuSelect = $('<select>').append(skus.map(sku => `<option value="${sku.ItemCode}">${sku.DisplayName}</option>`));
  const quantityInput = $('<input>').attr('type', 'number').attr('min', '1').attr('placeholder', 'Quantity').attr('required', 'required');

  const row = $('<div class="sku-row">').append(skuSelect, quantityInput);
  $('#skuList').append(row);
}

function validateForm() {
  let isValid = true;
  const requiredFields = ['#name', '#address1', '#city', '#state', '#zip', '#sampleType', '#country', '#shippingMethod'];
  
  requiredFields.forEach(selector => {
    if ($(selector).val().trim() === '') {
      isValid = false;
      $(selector).css('border', '1px solid red');
    } else {
      $(selector).css('border', '');
    }
  });

  $('#skuList .sku-row').each(function() {
    const sku = $(this).find('select').val();
    const quantity = $(this).find('input').val();
    if (sku.trim() === '' || quantity.trim() === '') {
      isValid = false;
      $(this).find('select, input').css('border', '1px solid red');
    } else {
      $(this).find('select, input').css('border', '');
    }
  });

  return isValid;
}

function generateCSV() {
  if (!validateForm()) {
    alert('Please fill in all required fields.');
    return;
  }

  const name = $('#name').val();
  const address1 = $('#address1').val();
  const address2 = $('#address2').val();
  const city = $('#city').val();
  const state = $('#state').val();
  const zip = $('#zip').val();
  const attentionLine = $('#attentionLine').val();
  const sampleType = $('#sampleType').val();
  const shippingMethod = $('#shippingMethod').val();
  const country = $('#country').val();
  const location = (country === 'Canada') ? 'Shipbob - Brampton FC' : 'Tagg - Bolingbrook FC';

  let csvContent = `Name,Attention Line,Address Line 1,Address Line 2,City,State,Zip Code,Country,Location,Sample Type,Shipping Method,SKU,Quantity\n`;
  $('#skuList > .sku-row').each(function() {
    const sku = $(this).find('select').val();
    const quantity = $(this).find('input').val();
    csvContent += `${name},${attentionLine},${address1},${address2},${city},${state},${zip},${country},${location},${sampleType},${shippingMethod},${sku},${quantity}\n`;
  });

  downloadCSV(csvContent);
}

function downloadCSV(csvContent) {
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', 'sample_request.csv');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
