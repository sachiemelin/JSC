//==============================================================================
// Author: Sachi Emelin Carissa (sachi.emelin@ui.ac.id)
// Project: Carbon Monoxide (CO) Monitoring in DKI Jakarta using Sentinel-5P
// 
// Data Sources:
// - https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S5P_NRTI_L3_CO
// - https://developers.google.com/earth-engine/guides/charts_image
//==============================================================================

//==============================================================================
// 1. INITIAL SETUP AND MAP CONFIGURATION
//==============================================================================

// Set map center to Jakarta (DKI)
Map.setCenter(106.84, -6.21, 4);

//==============================================================================
// 2. LOAD STUDY AREA BOUNDARY
//==============================================================================

// Load DKI Jakarta boundary
var DKIBorder = ee.FeatureCollection('users/sachiemelin/WilayahAdministrasi/DKI');

// Print DKI boundary for verification
print('DKI Border:', DKIBorder);

// Add DKI boundary to map
Map.centerObject(DKIBorder, 6);
Map.addLayer(DKIBorder, {color: 'FF0000'}, 'DKI Administrative Boundary');

//==============================================================================
// 3. LOAD AND FILTER SENTINEL-5P CO DATA
//==============================================================================

// Load Sentinel-5P CO collection and filter by date
var collection = ee.ImageCollection('COPERNICUS/S5P/NRTI/L3_CO')
  .select('CO_column_number_density')
  .filterDate('2023-01-01', '2023-04-01');

// Calculate mean CO values within study period
var meanCO = collection.mean().clip(DKIBorder);

//==============================================================================
// 4. VISUALIZATION PARAMETERS
//==============================================================================

var band_viz = {
  min: 0,
  max: 0.05,
  palette: ['black', 'blue', 'purple', 'cyan', 'green', 'yellow', 'red']
};

// Add CO layer to map
Map.addLayer(meanCO, band_viz, 'S5P CO 2023');

//==============================================================================
// 5. ADD LEGEND TO MAP
//==============================================================================

// Function to create color bar parameters
function makeColorBarParams(palette) {
  return {
    bbox: [0, 0, 1, 0.1],
    dimensions: '100x10',
    format: 'png',
    min: 0,
    max: 1,
    palette: palette,
  };
}

// Create color bar thumbnail
var colorBar = ui.Thumbnail({
  image: ee.Image.pixelLonLat().select(0),
  params: makeColorBarParams(band_viz.palette),
  style: {stretch: 'horizontal', margin: '0px 8px', maxHeight: '24px'},
});

// Create legend labels
var legendLabels = ui.Panel({
  widgets: [
    ui.Label(band_viz.min, {margin: '4px 8px'}),
    ui.Label(
        ((band_viz.max - band_viz.min) / 2 + band_viz.min),
        {margin: '4px 8px', textAlign: 'center', stretch: 'horizontal'}),
    ui.Label(band_viz.max, {margin: '4px 8px'})
  ],
  layout: ui.Panel.Layout.flow('horizontal')
});

// Create legend title
var legendTitle = ui.Label({
  value: 'CO Column Density',
  style: {fontWeight: 'bold', fontSize: '14px'}
});

// Assemble and add legend panel to map
var legendPanel = ui.Panel([legendTitle, colorBar, legendLabels], null, {
  position: 'bottom-left',
  style: {padding: '8px 15px'}
});
Map.add(legendPanel);

//==============================================================================
// 6. CREATE TIME SERIES CHART
//==============================================================================

// Create time series chart showing average CO values by date
var chart = ui.Chart.image.seriesByRegion({
  imageCollection: collection,
  regions: DKIBorder,
  reducer: ee.Reducer.mean(),
  scale: 500,
  seriesProperty: 'label',
  xProperty: 'system:time_start'
})
.setOptions({
  title: 'Average CO Value by Date (January - April 2023)',
  hAxis: {
    title: 'Date',
    titleTextStyle: {italic: false, bold: true}
  },
  vAxis: {
    title: 'CO Column Density (mol/m²)',
    titleTextStyle: {italic: false, bold: true}
  },
  lineWidth: 5,
  colors: ['f0af07', '0f8755', '76b349'],
  pointSize: 7,
  legend: {position: 'bottom'}
});

// Print chart to console
print('CO Time Series Chart:', chart);

//==============================================================================
// 7. EXPORT RESULTS
//==============================================================================

// Export mean CO data as cloud-optimized GeoTIFF
Export.image.toDrive({
  image: meanCO,
  description: 'CO_DKI_2023',
  scale: 100,
  region: DKIBorder,
  fileFormat: 'GeoTIFF',
  formatOptions: {
    cloudOptimized: true
  }
});

print('Export task created. Check Tasks tab to monitor progress.');
