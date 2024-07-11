let skuData = { "Canada": [], "United States": [] };
let selectedUserName = '';

$(document).ready(function() {
  loadSkuData();
  $('#country').change(updateCountrySpecificFields);
  $('#sampleType').val('144 Marketing Samples'); // Set default sample type
  $('#country').val('United States'); // Set default country
  $('#country').trigger('change'); // Initialize fields based on default country
});

function proceed() {
  selectedUserName = $('#userName').val();
  if (selectedUserName) {
    $('#preScreen').hide();
    $('#mainForm').show();
  } else {
    alert('Please select your name to proceed.');
  }
}

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

  const skuSelect = $('<select required class="form-control sku-select">').append(skus.map(sku => `<option value="${sku.ItemCode}">${sku.DisplayName}</option>`));
  const quantityInput = $('<input>').attr('type', 'number').attr('min', '1').attr('placeholder', 'Qty').attr('required', 'required').addClass('form-control qty-input').css('width', '90px');
  const deleteButton = $('<button type="button" class="btn btn-danger">Delete</button>').click(function() {
    $(this).parent().remove();
  });

  const row = $('<div class="sku-row">').append(skuSelect, quantityInput, deleteButton);
  $('#skuList').append(row);

  // Initialize Select2 on the new SKU select element
  skuSelect.select2({
    matcher: function(params, data) {
      // If there are no search terms, return all data
      if ($.trim(params.term) === '') {
        return data;
      }

      // Make the search case-insensitive
      if (typeof data.text === 'undefined') {
        return null;
      }

      // Perform wildcard search
      const term = params.term.toLowerCase();
      const text = data.text.toLowerCase();
      if (text.indexOf(term) > -1) {
        const modifiedData = $.extend({}, data, true);
        return modifiedData;
      }

      // Return `null` if the term should not be displayed
      return null;
    }
  });
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

  const today = new Date();
  const date = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
  const start = new Date(today.getFullYear(), 0, 0);
  const diff = today - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const year = today.getFullYear().toString().slice(-2);
  const poNumber = `${selectedUserName}-${year}${dayOfYear}-${Math.floor(100 + Math.random() * 900)}`;
  const externalId = `SO${Math.floor(100000 + Math.random() * 900000)}`;

  let csvContent = `External ID,PO #,Customer,Date,Shipping Method,Country,Addressee,Address 1,Address 2,Attention,City,State,ZIP,Location,Item,Qty,Rate\n`;

  $('#skuList > .sku-row').each(function() {
    const sku = $(this).find('select').val();
    const quantity = $(this).find('input').val();
    csvContent += `${externalId},${poNumber},${sampleType},${date},${shippingMethod},${country},${name},${address1},${address2},${attentionLine},${city},${state},${zip},${location},${sku},${quantity},0\n`;
  });

  downloadCSV(csvContent, `Sample Request ${poNumber}.csv`);
  showSuccessMessage(poNumber);
}

function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function showSuccessMessage(poNumber) {
  $('#successMessage').text(`Thank you! Your order number is: ${poNumber}`).show();
}
