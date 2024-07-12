let skuData = { "Canada": [], "United States": [], "Bundles": { "Canada": [], "United States": [] } };
let bundleContents = {};
let selectedUserName = '';
let currentSkus = [];
let currentBundles = [];

$(document).ready(function() {
  loadSkuData();
  loadBundleContents();
  $('#country').change(updateCountrySpecificFields);
  $('#sampleType').val('144 Marketing Samples'); // Set default sample type
  $('#country').val('United States'); // Set default country
  $('#country').trigger('change'); // Initialize fields based on default country
  $('#addSkuButton').click(function() {
    addSkuRow();
  });
  
  // Add event listeners for required fields
  $('#name, #address1, #city, #state, #zip').on('focus', function() {
    $(this).attr('placeholder', '');
  }).on('blur', function() {
    if ($(this).val().trim() === '') {
      $(this).attr('placeholder', 'Required');
    }
  });
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
      console.log("SKU Data Loaded:", results.data);
      results.data.forEach(row => {
        console.log(row);
        if (row.DisplayNameUSA && row.ItemCodeUSA) {
          let isBundleUSA = row.IsBundleUSA.trim().toLowerCase() === 'true';
          if (isBundleUSA) {
            skuData["Bundles"]["United States"].push({ DisplayName: row.DisplayNameUSA, ItemCode: row.ItemCodeUSA });
          } else {
            skuData["United States"].push({ DisplayName: row.DisplayNameUSA, ItemCode: row.ItemCodeUSA });
          }
        }

        if (row.DisplayNameCanada && row.ItemCodeCanada) {
          let isBundleCanada = row.IsBundleCanada.trim().toLowerCase() === 'true';
          if (isBundleCanada) {
            skuData["Bundles"]["Canada"].push({ DisplayName: row.DisplayNameCanada, ItemCode: row.ItemCodeCanada });
          } else {
            skuData["Canada"].push({ DisplayName: row.DisplayNameCanada, ItemCode: row.ItemCodeCanada });
          }
        }
      });
      updateCountrySpecificFields();
    },
    error: function(err) {
      console.error("Error loading SKU data:", err);
    }
  });
}

function loadBundleContents() {
  Papa.parse('Bundles.csv', {
    download: true,
    header: true,
    complete: function(results) {
      console.log("Bundle Contents:", results.data);
      results.data.forEach(row => {
        if (!bundleContents[row.BundleCode]) {
          bundleContents[row.BundleCode] = [];
        }
        bundleContents[row.BundleCode].push({ ItemCode: row.ItemCode, Quantity: row.Quantity });
      });
    },
    error: function(err) {
      console.error("Error loading bundle contents:", err);
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

  $('#shippingMethod').empty();
  shippingMethods.forEach(method => {
    $('#shippingMethod').append(`<option value="${method}">${method}</option>`);
  });
}

function updateSkuOptions(country) {
  currentSkus = skuData[country] || [];
  currentBundles = skuData["Bundles"][country] || [];
  console.log(`Updating SKU options for ${country}. Regular SKUs: ${currentSkus.length}, Bundles: ${currentBundles.length}`);
  $('#skuList').empty();
  addSkuRow();
}

function addSkuRow() {
  const allOptions = [...currentBundles, ...currentSkus]; // Bundles first, then regular SKUs
  const skuSelect = $('<select required class="form-control sku-select">').append(
    $('<option value="">Select an item</option>'),
    allOptions.map(sku => `<option value="${sku.ItemCode}">${sku.DisplayName}</option>`)
  );
  const quantityInput = $('<input type="number" min="1" placeholder="Qty" required class="form-control qty-input" style="width: 90px;">');
  const deleteButton = $('<button type="button" class="btn btn-danger">Delete</button>').click(function() {
    $(this).parent().remove();
  });

  const row = $('<div class="sku-row">').append(skuSelect, quantityInput, deleteButton);
  $('#skuList').append(row);

  skuSelect.select2({
    matcher: function(params, data) {
      if ($.trim(params.term) === '') return data;
      if (typeof data.text === 'undefined') return null;
      if (data.text.toLowerCase().indexOf(params.term.toLowerCase()) > -1) return data;
      return null;
    }
  });

  skuSelect.change(function() {
    const selectedSku = $(this).val();
    if (bundleContents[selectedSku]) {
      $(this).parent().remove();
      bundleContents[selectedSku].forEach(bundleItem => {
        const bundleSku = allOptions.find(sku => sku.ItemCode === bundleItem.ItemCode);
        if (bundleSku) {
          addBundleItem(bundleSku, bundleItem.Quantity);
        }
      });
    }
  });
}

function addBundleItem(bundleSku, quantity) {
  const row = $('<div class="sku-row">').append(
    $('<select required class="form-control sku-select">').append(`<option value="${bundleSku.ItemCode}">${bundleSku.DisplayName}</option>`),
    $('<input type="number" min="1" placeholder="Qty" required class="form-control qty-input" style="width: 90px;" value="'+quantity+'">'),
    $('<button type="button" class="btn btn-danger">Delete</button>').click(function() { $(this).parent().remove(); })
  );
  $('#skuList').append(row);
  row.find('select').select2({
    matcher: function(params, data) {
      if ($.trim(params.term) === '') return data;
      if (typeof data.text === 'undefined') return null;
      if (data.text.toLowerCase().indexOf(params.term.toLowerCase()) > -1) return data;
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
    if (bundleContents[sku]) {
      bundleContents[sku].forEach(item => {
        csvContent += `${externalId},${poNumber},${sampleType},${date},${shippingMethod},${country},${name},${address1},${address2},${attentionLine},${city},${state},${zip},${location},${item.ItemCode},${item.Quantity * quantity},0\n`;
      });
    } else {
      csvContent += `${externalId},${poNumber},${sampleType},${date},${shippingMethod},${country},${name},${address1},${address2},${attentionLine},${city},${state},${zip},${location},${sku},${quantity},0\n`;
    }
  });

  downloadCSV(csvContent, `Sample Request ${poNumber}.csv`);
  showSuccessMessage(poNumber);
}

function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', filename);
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function showSuccessMessage(poNumber) {
  $('#successMessage').text(`Thank you! Your order number is: ${poNumber}`).show();
}
