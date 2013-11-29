var data, bounds, lbounds;
var pctFormat = d3.format(".1%");
var popFormat = d3.format(",.2s");
var commaNumFormat = d3.format(",");
var  toolTip = CustomTooltip("tooltip", 150);
var geocoder = new google.maps.Geocoder();
var lmap = L.mapbox.map('detailmap', 'fcc.map-rons6wgv', {maxZoom: 16})
      .setView([39.5, -98.5], 4);
var svgMap = d3.select(lmap.getPanes().overlayPane).append("svg"),
    gMap = svgMap.append("g").attr("class", "leaflet-zoom-hide");

var markers = new L.MarkerClusterGroup({
                        showCoverageOnHover:false, 
                        maxClusterRadius:30,
                        spiderfyDistanceMultiplier:2});
var markerList=[];


queue()
  .defer(d3.csv, "data/demographics.csv")
  .defer(d3.json, "data/statecounty.json")
  .defer(d3.csv, "data/radio_station.csv")
  .await(ready);

function ready(error, demo,boundary,radios){
    d3.select("#address").on("keypress", function(){geocodeAddress(d3.event.keyCode)});
     d3.select("#reset").on("click", function(e){reset("all")});

     $("#numListnersSlider").slider({
      min:0,
      max:400000,
      step:10000,
      value: [0,400000],
      tooltip:'hide'
     })
     .on('slide', function(ui){
      $( "#numListners" ).text(popFormat(ui.value[ 0 ]) + " - " + popFormat(ui.value[ 1 ]) );
     })
     .on('slideStop', function(ui){change()});
      $( "#numListners" ).text("0" + " - " + "400k");



  var geographyDemo = demo;
  geographyDemo.forEach(function(d) {
    d.total_populuation = +d.total_population;
    d.total_households = +d.total_households;
    d.percent_hispanic = +d.percent_hispanic;
    d.hispanic_population = +d.hispanic_population;
  });

   stateDemo = d3.nest()
                    .key(function(d){
                        return d.geography_id
                    })
                  .map(geographyDemo.filter(function(d){return d.geography_type == "STATE"}));


   countyDemo = d3.nest()
                    .key(function(d){
                        return d.geography_id
                    })
                  .map(geographyDemo.filter(function(d){return d.geography_type == "COUNTY"}));


   stateBoundary = topojson.feature(boundary, boundary.objects.state);
   stateBoundary.features.forEach(function(d){
      d.properties.boundaryType="state";
      if(typeof stateDemo[d.id] != "undefined"){
        d.properties.percent_hispanic = stateDemo[d.id][0].percent_hispanic;
        d.properties.total_population = stateDemo[d.id][0].total_population;
        d.properties.total_households = stateDemo[d.id][0].total_households;
        d.properties.hispanic_population = stateDemo[d.id][0].hispanic_population;
      }
  });

   countyBoundary = topojson.feature(boundary, boundary.objects.county);
   countyBoundary.features.forEach(function(d){
      d.properties.boundaryType="county";
      if(typeof countyDemo[d.id] != "undefined"){
        d.properties.percent_hispanic = countyDemo[d.id][0].percent_hispanic;
        d.properties.total_population = countyDemo[d.id][0].total_population;
        d.properties.total_households = countyDemo[d.id][0].total_households;
        d.properties.hispanic_population = countyDemo[d.id][0].hispanic_population;
      }
  })

   radioStations = radios;
   radioStations.forEach(function(d){
    d.latitude = +d.latitude;
    d.longitude = +d.longitude;
    d.number_of_listeners = +d.number_of_listeners;
   })

    data = crossfilter(radioStations);
    data.numListeners = data.dimension(function(d){return d.number_of_listeners});
  //   data.groupByFips = data.fips.group();
  //   data.type = data.dimension(function(d){return d.type});
  //   data.level = data.dimension(function(d){return d.level});
  //   data.locality = data.dimension(function(d){return d.ulocal});
  //   data.frlPct = data.dimension(function(d){return d.frlpct});
  //   data.member = data.dimension(function(d){return d.member});
  //   data.maxdown = data.dimension(function(d){return d.maxdown});
   //.features.filter(function(d){
   //         return d.id != '60' && d.id != '69' && d.id != '66' && d.id != '78'});
  //var stateJson = topojson.feature(state,state.objects.state)
  bounds = d3.geo.bounds({type:"FeatureCollection", features:stateBoundary});

  stateLayer = L.geoJson(stateBoundary,{
                  style: style,
                  onEachFeature:onEachFeature
                }
              )
              .addTo(lmap)
  countyLayer = L.geoJson(countyBoundary,{
                  style: style,
                  onEachFeature:onEachFeature
                }
              )
                  // #91282c  red
                  // #cf632d orange

       
  //reset("all");
  lmap.on('viewreset', function() {
     var zoom = this.getZoom();
     if (zoom >6){
      if (lmap.hasLayer(stateLayer)) lmap.removeLayer(stateLayer);
      if (!lmap.hasLayer(countyLayer)) lmap.addLayer(countyLayer);
     }else{
      if (!lmap.hasLayer(stateLayer)) lmap.addLayer(stateLayer);
      if (lmap.hasLayer(countyLayer)) lmap.removeLayer(countyLayer);
     }
  }, lmap);

  drawMarkers();
}

function change(){
  var filterNumListners = $('#numListnersSlider').data('slider').getValue();
  data.numListeners.filterAll();
  data.numListeners.filterRange([filterNumListners[0],filterNumListners[1]+1]);
  drawMarkers();
}

function drawMarkers(){
  if(markerList.length>0){
    markers.removeLayers(markerList);
  }
  markerList = [];
  data.numListeners.top(Infinity).forEach(function(d){
      var title = d.AffiliateName;
      var marker = L.marker(new L.LatLng(d.latitude,d.longitude),{
        icon: L.mapbox.marker.icon({'marker-symbol': 'music', 'marker-size':'small','marker-color': '0044FF'})
        //title:title
      });
      marker.AffiliateName = d.AffiliateName;
      marker.dma = d.DMA;
      marker.metroMarket = d.MetroMarket;
      marker.numListners = d.number_of_listeners;
      //marker.bindPopup(title);
      markerList.push(marker);
  })
  markers.addLayers(markerList);
  markers.on('mouseover', highlightFeature);
  markers.on('mouseout', resetHighlight)
  if (lmap.hasLayer(markers)){
    lmap.removeLayer(markers);
  }
  lmap.addLayer(markers);
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        //click: zoomToFeature
    });
}

function highlightFeature(e) {
  var content = ""
  if (typeof e.layer != "undefined"){ //for stations
    //console.log(e);
    content += "<span class='name'>Name: </span><span class='value'>" + e.layer.AffiliateName + "</span></br>";
    content += "<span class='name'>DMA: </span><span class='value'>" + e.layer.dma + "</span></br>";
    content += "<span class='name'>Market: </span><span class='value'>" + e.layer.metroMarket+ "</span></br>";
    content += "<span class='name'>Listners: </span><span class='value'>" + commaNumFormat(e.layer.numListners) + "</span>";
    toolTip.showTooltip(content,e.originalEvent);

  }else{ //for county and state
    var layer = e.target;
    var feature = layer.feature.properties;
    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });
    if (!L.Browser.ie && !L.Browser.opera) {
        layer.bringToFront();
    }

    if (feature.boundaryType == "state"){
      content += "<span class='name'>State: </span><span class='value'>" + feature.name + "</span></br>";
    }else{
      content += "<span class='name'>County: </span><span class='value'>" + feature.name + "</span></br>";
    }
      content += "<span class='name'>Hispanic Pop Pct: </span><span class='value'>" + pctFormat(feature.percent_hispanic) + "</span></br>";
      content += "<span class='name'>Hispanic Pop: </span><span class='value'>" + commaNumFormat(feature.hispanic_population) + "</span></br>";
      content += "<span class='name'>Total Pop: </span><span class='value'>" + commaNumFormat(feature.total_population) + "</span></br>";
      content += "<span class='name'>Total Households: </span><span class='value'>" + commaNumFormat(feature.total_households) + "</span>";
      toolTip.showTooltip(content,e.originalEvent);
  }
}

function resetHighlight(e) {
   if (typeof e.layer == "undefined"){
        stateLayer.resetStyle(e.target);
      }
    toolTip.hideTooltip();
}

function style(feature) {
    return {
        fillColor: getColor(feature.properties.percent_hispanic),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}
function getColor(d) {
    return d > 0.5 ? '#807267' :
           d > 0.25  ? '#987e65' :
           d >=0.16  ? '#af9d88' :
           d >=0.05  ? '#e1cfb7' :
           d >= 0   ? '#e7e7e7' : 'black'
}

function geocodeAddress(e){
  // geocoder.geocode({ 'address': address }, function(results, status) {
    //console.log(e)
    if (e == 13){
      var address = d3.select("#address").property("value");
        geocoder.geocode({ 'address': address }, function(results, status) {
          if (status == google.maps.GeocoderStatus.OK) {
            //console.log(results)
            var Coords = {};
            Coords.lat = results[0].geometry.location.ob;
            Coords.lng = results[0].geometry.location.pb;
            lmap.setView(Coords, 9);
          }
      })
    }
}

function reset(resetType){

  $( "#listnersNum" ).text("0" + " - " + "400k");
  $('#numListnersSlider').slider('setValue', [0,400000]);
  data.numListeners.filterAll();
  change();
        lmap.setView([39.5, -98.5], 4);
        $("#address").val("");
}

