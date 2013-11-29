var data, profileData,targetProfile, bandDataByBidType, dmaData=[],stationFilter, dmaFilter,dataByBand, dmaStats;
var channelRange, resultChannelRange,populationRange,dmaRankRange, dmaStationRange, offairChangebandRange,spectrumUtilizationRange;
var bounds,dmaPathOnStationMap,dmaFeatureOnStationMap;
var dmaPathOnDMAMap, dmaFeatureOnDMAMap, dmaBoundaryOnDMAMap=null;
var stationCircleOnStationMap=null;
var avgAQHScale = d3.scale.sqrt().range([2,20]);
var dmaFillColor = d3.scale.linear().domain([0,0.5]).range(["white","red"]);
var maxSpectrumChannel = 51;
var lSpectrumChannel=2,hSpectrumChannel;


//station map
var stationMap = L.mapbox.map('stationMap', 'https://a.tiles.mapbox.com/v3/fcc.map-toolde8w.json?secure')
//'examples.map-4l7djmvo')
      .setView([39.5, -98.5], 4);
stationMap.on("viewreset", resetStationMap);
var svgStationMap = d3.select(stationMap.getPanes().overlayPane).append("svg").attr("id","d3overlayStation");
var stationOverlayMap = svgStationMap.append("g").attr("class", "leaflet-zoom-hide")

//dma map
//var dmaMap = L.mapbox.map('dmaMap', 'fcc.map-toolde8w')
var dmaMap = L.mapbox.map('dmaMap', 'https://a.tiles.mapbox.com/v3/fcc.map-toolde8w.json?secure')
//'examples.map-4l7djmvo')
      .setView([39.5, -98.5], 4);
dmaMap.on("viewreset", resetDMAMap);
var svgDMAMap = d3.select(dmaMap.getPanes().overlayPane).append("svg").attr("id","d3overlayDMA");
var dmaOverlayMap = svgDMAMap.append("g").attr("class", "leaflet-zoom-hide")
var profileID="101";
//ajax call to get data
queue()
    .defer(d3.json,"data/dma.topojson")
    .defer(d3.csv, "data/1_station.csv")
    .defer(d3.csv, "data/1_dma.csv")
    .await(ready);

// data loaded and processing
function ready(error,dma,stationData, hcndma) {
	if (error) throw error;
  data = stationData;

  //station data
  data.forEach(function(d,i){
    d.channel = +d.channel;
    d.avg_aqh = isNaN(+d.avg_aqh) ? 0 : +d.avg_aqh;
    d.male_aqh = +d.male_aqh;
    d.female_aqh = +d.female_aqh;
    d["18to34_aqh"] = +d["18to34_aqh"];
    d["35to49_aqh"] = +d["35to49_aqh"];
    d["50plus_aqh"] = +d["50plus_aqh"];
    d.mon_fri_aqh = +d.mon_fri_aqh;
    d.weekend_aqh = +d.weekend_aqh;
    d.latitude = +d.latitude;
    d.longitude = +d.longitude;
   });

      
 dmaData = hcndma;
    dmaData.forEach(function(d){
     	d.dma_pop = +d.dma_pop;
     	d.percent_hispanic = +d.percent_hispanic;
     	d.hispanic_population = +d.hispanic_population;
     	d.number_of_stations = +d.number_of_stations;
     	d.percent_pop_hsgrad = +d.percent_pop_hsgrad;
     	d.percent_age_greater60 = +d.percent_age_greater60;
     	d.percent_income_below_povertyline = +d.percent_income_below_povertyline;
     });

      dmaJson = topojson.feature(dma, dma.objects.dma);
     //add boundary to station leaflet map too
     bounds = d3.geo.bounds(dmaJson);
    var dmaJsonObj = d3.nest().key(function(d){return d.id}).map(dmaJson.features);
	dmaData.forEach(function(d){
    	d.geometry = dmaJsonObj[d.dma_id][0].geometry;
    	d.type = "Feature";
    	d.properties={};
	})

    	//crossfileter for station
	stationFilter = crossfilter(data);
	stationFilter.avg_aqh = stationFilter.dimension(function(d){return d.avg_aqh});
	stationFilter.male_aqh = stationFilter.dimension(function(d){return d.male_aqh});
	stationFilter.female_aqh = stationFilter.dimension(function(d){return d.female_aqh});
	stationFilter["18to34_aqh"] = stationFilter.dimension(function(d){return d["18to34_aqh"]});
	stationFilter["35to49_aqh"] = stationFilter.dimension(function(d){return d["35to49_aqh"]});
	stationFilter["50plus_aqh"] = stationFilter.dimension(function(d){return d["50plus_aqh"]});
	stationFilter.weekday_aqh = stationFilter.dimension(function(d){return d.mon_fri_aqh});
	stationFilter.weekend_aqh = stationFilter.dimension(function(d){return d.weekend_aqh});


	//crossfilter for DMA
	dmaFilter = crossfilter(dmaData);
	dmaFilter.dma_pop = dmaFilter.dimension(function(d){return d.dma_pop});
	dmaFilter.station_number = dmaFilter.dimension(function(d){return d.number_of_stations});
	dmaFilter.percent_hispanic = dmaFilter.dimension(function(d){return d.percent_hispanic});
	dmaFilter.percent_pop_hsgrad = dmaFilter.dimension(function(d){return d.percent_pop_hsgrad});
	dmaFilter.percent_age_greater60 = dmaFilter.dimension(function(d){return d.percent_age_greater60});
	dmaFilter.percent_income_below_povertyline = dmaFilter.dimension(function(d){return d.percent_income_below_povertyline});



    initFilters();

        //set scale domain
    avgAQHScale.domain(avg_aqhRange);
    //dmaFillColor.domain(spectrumUtilizationRange);

   	//for station map
   	//add dma layer
   	//map stuff

     dmaPathOnStationMap = d3.geo.path().projection(projectStation);
     dmaBoundaryOnStationMap = stationOverlayMap.selectAll("path")
              .data(dmaData)
              .enter().append("path")
              .attr("class","dmaBoundaryOnStation");

    resetStationMap();     

   	//for station page
  	setStationTableTitle();
   	sliderStopStations();

   	//for DMA page
  	 //add dma boundary to leaflet dma map
	  dmaBoundaryOnDMAMap = dmaOverlayMap.selectAll(".dmaBoundaryOnDMA")
	    .data(dmaData).enter().append("path")
	  	.attr("class","dmaBoundaryOnDMA");

     dmaPathOnDMAMap = d3.geo.path().projection(projectDMA);
     drawDMAMap();
     updateSpectrumOnDMAMap();

    //resetDMAMap();
    drawDMALegend();
    setDMATableTitle();
  	sliderStopDMA();
}



function initFilters(){
	    //initiate station sliders
     avg_aqhRange = d3.extent(data,function(d){return d.avg_aqh});
     male_aqhRange = d3.extent(data,function(d){return d.male_aqh});
     female_aqhRange = d3.extent(data,function(d){return d.female_aqh});
     age_18to34_aqhRange = d3.extent(data,function(d){return d["18to34_aqh"]});
    age_35to49_aqhRange = d3.extent(data,function(d){return d["35to49_aqh"]});
    age_50plus_aqhRange = d3.extent(data,function(d){return d["50plus_aqh"]});
    weekday_aqhRange = d3.extent(data,function(d){return d.mon_fri_aqh});
    weekend_aqhRange = d3.extent(data,function(d){return d.weekend_aqh});

    $( "#avg_aqhNum" ).text(avg_aqhRange[0] + " - " + avg_aqhRange[1]);
	  $( "#avg_aqhSlider" ).slider({
	    range: true,
	    min: avg_aqhRange[0],
	    max: avg_aqhRange[1],
	    values: avg_aqhRange,
	    step: 500,
	    slide: function( event, ui ) {
	      $( "#avg_aqhNum" ).text(ui.values[ 0 ] + " - " + ui.values[ 1 ] );
		  stationFilter.avg_aqh.filterRange([ui.values[0],ui.values[1]+1]);
	      sliderChangeStations();
	    },
	    stop:function(event,ui){sliderStopStations()}
	  });

	$( "#male_aqhNum" ).text(male_aqhRange[0] + " - " + male_aqhRange[1]);
		  $( "#male_aqhSlider" ).slider({
	    range: true,
	    min: male_aqhRange[0],
	    max: male_aqhRange[1],
	    values: male_aqhRange,
	    step: 500,
	    slide: function( event, ui ) {
	      $( "#male_aqhNum" ).text(ui.values[ 0 ] + " - " + ui.values[ 1 ] );
	      stationFilter.male_aqh.filterRange([ui.values[0],ui.values[1]+1]);
	      sliderChangeStations();
	    },
	    stop:function(event,ui){sliderStopStations()}
	  });

	$( "#female_aqhNum" ).text(female_aqhRange[0] + " - " + female_aqhRange[1]);
		  $( "#female_aqhSlider" ).slider({
	    range: true,
	    min: female_aqhRange[0],
	    max: female_aqhRange[1],
	    values: female_aqhRange,
	    step: 500,
	    slide: function( event, ui ) {
	      $( "#female_aqhNum" ).text(ui.values[ 0 ] + " - " + ui.values[ 1 ] );
	      stationFilter.female_aqh.filterRange([ui.values[0],ui.values[1]+1]);
	      sliderChangeStations();
	    },
	   stop:function(event,ui){sliderStopStations()}
	  });

	$( "#age_18to34_aqhNum").text(age_18to34_aqhRange[0] + " - " + age_18to34_aqhRange[1]);
		  $( "#age_18to34_aqhSlider" ).slider({
	    range: true,
	    min: age_18to34_aqhRange[0],
	    max: age_18to34_aqhRange[1],
	    values: age_18to34_aqhRange,
	    step: 500,
	    slide: function( event, ui ) {
	      $( "#age_18to34_aqhNum" ).text(ui.values[ 0 ] + " - " + ui.values[ 1 ] );
	      stationFilter["18to34_aqh"].filterRange([ui.values[0], ui.values[1]+1]);
	      sliderChangeStations();
	    },
	   stop:function(event,ui){sliderStopStations()}
	  });

		$( "#age_35to49_aqhNum").text(age_35to49_aqhRange[0] + " - " + age_35to49_aqhRange[1]);
		  $( "#age_35to49_aqhSlider" ).slider({
	    range: true,
	    min: age_35to49_aqhRange[0],
	    max: age_35to49_aqhRange[1],
	    values: age_35to49_aqhRange,
	    step: 500,
	    slide: function( event, ui ) {
	      $( "#age_35to49_aqhNum" ).text(ui.values[ 0 ] + " - " + ui.values[ 1 ] );
	      stationFilter["35to49_aqh"].filterRange([ui.values[0], ui.values[1]+1]);
	      sliderChangeStations();
	    },
	   stop:function(event,ui){sliderStopStations()}
	  });

			$( "#age_50plus_aqhNum").text(age_50plus_aqhRange[0] + " - " + age_50plus_aqhRange[1]);
		  $( "#age_50plus_aqhSlider" ).slider({
	    range: true,
	    min: age_50plus_aqhRange[0],
	    max: age_50plus_aqhRange[1],
	    values: age_50plus_aqhRange,
	    step: 500,
	    slide: function( event, ui ) {
	      $( "#age_50plus_aqhNum" ).text(ui.values[ 0 ] + " - " + ui.values[ 1 ] );
	      stationFilter["50plus_aqh"].filterRange([ui.values[0], ui.values[1]+1]);
	      sliderChangeStations();
	    },
	   stop:function(event,ui){sliderStopStations()}
	  });

		  			$( "#weekday_aqhNum").text(weekday_aqhRange[0] + " - " + weekday_aqhRange[1]);
		  $( "#weekday_aqhSlider" ).slider({
	    range: true,
	    min: weekday_aqhRange[0],
	    max: weekday_aqhRange[1],
	    values: weekday_aqhRange,
	    step: 500,
	    slide: function( event, ui ) {
	      $( "#weekday_aqhNum" ).text(ui.values[ 0 ] + " - " + ui.values[ 1 ] );
	      stationFilter["weekday_aqh"].filterRange([ui.values[0], ui.values[1]+1]);
	      sliderChangeStations();
	    },
	   stop:function(event,ui){sliderStopStations()}
	  });

		$( "#weekend_aqhNum").text(weekend_aqhRange[0] + " - " + weekend_aqhRange[1]);
		  $( "#weekend_aqhSlider" ).slider({
	    range: true,
	    min: weekend_aqhRange[0],
	    max: weekend_aqhRange[1],
	    values: weekend_aqhRange,
	    step: 500,
	    slide: function( event, ui ) {
	      $( "#weekend_aqhNum" ).text(ui.values[ 0 ] + " - " + ui.values[ 1 ] );
	      stationFilter["weekend_aqh"].filterRange([ui.values[0], ui.values[1]+1]);
	      sliderChangeStations();
	    },
	   stop:function(event,ui){sliderStopStations()}
	  });


//initiate dma filters
	dmaPopRange = d3.extent(dmaData,function(d){return d.dma_pop});
	dmaHispanicPctRange = d3.extent(dmaData,function(d){return d.percent_hispanic});
	dmaHighSchoolGradPctRange = d3.extent(dmaData,function(d){return d.percent_pop_hsgrad});
	dmaAgeGreater60PctRange = d3.extent(dmaData,function(d){return d.percent_age_greater60});
	dmaBelowPovertyPctRange = d3.extent(dmaData,function(d){return d.percent_income_below_povertyline});



	$( "#dmaPopNum" ).text(popFormat(dmaPopRange[0]) + " - " + popFormat(dmaPopRange[1]));
		  $( "#dmaPopSlider" ).slider({
	    range: true,
	    min: dmaPopRange[0],
	    max: dmaPopRange[1],
	    values: dmaPopRange,
	    step: 500000,
	    slide: function( event, ui ) {
	      $( "#dmaPopNum" ).text(popFormat(ui.values[ 0 ]) + " - " + popFormat(ui.values[ 1 ]) );
	      dmaFilter.dma_pop.filterRange([ui.values[0],ui.values[1]+1]);
	      sliderChangeDMA();
	    },
	   stop:function(event,ui){sliderStopDMA()}
	  });


    $( "#dmaHispanicPctNum").text(pctFormat(dmaHispanicPctRange[0]) + " - " + pctFormat(dmaHispanicPctRange[1]));
	  $( "#dmaHispanicPctSlider" ).slider({
	    range: true,
	    min: dmaHispanicPctRange[0],
	    max: dmaHispanicPctRange[1],
	    values: dmaHispanicPctRange,
	    step: 0.05,
	    slide: function( event, ui ) {
	      $( "#dmaHispanicPctNum" ).text(pctFormat(ui.values[ 0 ]) + " - " + pctFormat(ui.values[ 1 ]) );
		  dmaFilter.percent_hispanic.filterRange([ui.values[0],ui.values[1]+1]);
	      sliderChangeDMA();
	    },
	    stop:function(event,ui){sliderStopDMA()}
	  });

	$( "#dmaHighSchoolGradPctNum" ).text(pctFormat(dmaHighSchoolGradPctRange[0]) + " - " + pctFormat(dmaHighSchoolGradPctRange[1]));
		  $( "#dmaHighSchoolGradPctSlider" ).slider({
	    range: true,
	    min: dmaHighSchoolGradPctRange[0],
	    max: dmaHighSchoolGradPctRange[1],
	    values: dmaHighSchoolGradPctRange,
	    step: 0.05,
	    slide: function( event, ui ) {
	      $( "#dmaHighSchoolGradPctNum" ).text(pctFormat(ui.values[ 0 ]) + " - " + pctFormat(ui.values[ 1 ]) );
	      dmaFilter.percent_pop_hsgrad.filterRange([ui.values[0],ui.values[1]+0.01]);
	      sliderChangeDMA();
	    },
	    stop:function(event,ui){sliderStopDMA()}
	  });

	$( "#dmaAgeGreater60PctNum" ).text(pctFormat(dmaAgeGreater60PctRange[0]) + " - " + pctFormat(dmaAgeGreater60PctRange[1]));
		  $( "#dmaAgeGreater60PctSlider" ).slider({
	    range: true,
	    min: dmaAgeGreater60PctRange[0],
	    max: dmaAgeGreater60PctRange[1],
	    values: dmaAgeGreater60PctRange,
	    step: 0.01,
	    slide: function( event, ui ) {
	      $( "#dmaAgeGreater60PctNum" ).text(pctFormat(ui.values[ 0 ]) + " - " + pctFormat(ui.values[ 1 ]) );
	      dmaFilter.percent_age_greater60.filterRange([ui.values[0],ui.values[1]+0.01]);
	      sliderChangeDMA();
	    },
	    stop:function(event,ui){sliderStopDMA()}
	  });

		  $( "#dmaBelowPovertyPctNum" ).text(pctFormat(dmaBelowPovertyPctRange[0]) + " - " + pctFormat(dmaBelowPovertyPctRange[1]));
		  $( "#dmaBelowPovertyPctSlider" ).slider({
	    range: true,
	    min: dmaBelowPovertyPctRange[0],
	    max: dmaBelowPovertyPctRange[1],
	    values: dmaBelowPovertyPctRange,
	    step: 0.01,
	    slide: function( event, ui ) {
	      $( "#dmaBelowPovertyPctNum" ).text(pctFormat(ui.values[ 0 ]) + " - " + pctFormat(ui.values[ 1 ]) );
	      dmaFilter.percent_income_below_povertyline.filterRange([ui.values[0],ui.values[1]+0.01]);
	      sliderChangeDMA();
	    },
	    stop:function(event,ui){sliderStopDMA()}
	  });
}

function reset(resetType){
        if(resetType == "station"){
        	resetStationFilter();
             $( "#avg_aqhSlider").slider("values", avg_aqhRange);
             $( "#avg_aqhNum").text(avg_aqhRange[0]+ " - " + avg_aqhRange[1]);
             $( "#male_aqhSlider").slider("values", male_aqhRange);
             $( "#male_aqhNum").text(male_aqhRange[0]+ " - " + male_aqhRange[1]);
             $( "#female_aqhSlider").slider("values", female_aqhRange);
             $( "#female_aqhNum").text(female_aqhRange[0]+ " - " + female_aqhRange[1]);
             $( "#age_18to34_aqhSlider").slider("values", age_18to34_aqhRange);
             $( "#age_18to34_aqhNum").text(age_18to34_aqhRange[0]+ " - " + age_18to34_aqhRange[1]);
             $( "#age_35to49_aqhSlider").slider("values", age_35to49_aqhRange);
             $( "#age_35to49_aqhNum").text(age_35to49_aqhRange[0]+ " - " + age_35to49_aqhRange[1]);
                          $( "#age_50plus_aqhSlider").slider("values", age_50plus_aqhRange);
             $( "#age_50plus_aqhNum").text(age_50plus_aqhRange[0]+ " - " + age_50plus_aqhRange[1]);
                          $( "#weekday_aqhSlider").slider("values", weekday_aqhRange);
             $( "#weekday_aqhNum").text(weekday_aqhRange[0]+ " - " + weekday_aqhRange[1]);
                          $( "#weekend_aqhSlider").slider("values", weekend_aqhRange);
             $( "#weekend_aqhNum").text(weekend_aqhRange[0]+ " - " + weekend_aqhRange[1]);
             sliderChangeStations();
             sliderStopStations();
        }
        else if(resetType == "dma"){
            resetDMAFilter();
             $( "#dmaPopSlider").slider("values", dmaPopRange);
             $( "#dmaPopNum").text(popFormat(dmaPopRange[0])+ " - " + popFormat(dmaPopRange[1]));
             $( "#dmaHispanicPctSlider").slider("values", dmaHispanicPctRange);
             $( "#dmaHispanicPctNum").text(pctFormat(dmaHispanicPctRange[0])+ " - " + pctFormat(dmaHispanicPctRange[1]));
             $( "#dmaHighSchoolGradPctSlider").slider("values", dmaHighSchoolGradPctRange);
             $( "#dmaHighSchoolGradPctNum").text(pctFormat(dmaHighSchoolGradPctRange[0])+ " - " + pctFormat(dmaHighSchoolGradPctRange[1]));
             $( "#dmaAgeGreater60PctSlider").slider("values", dmaAgeGreater60PctRange);
             $( "#dmaAgeGreater60PctNum").text(pctFormat(dmaAgeGreater60PctRange[0])+ " - " + pctFormat(dmaAgeGreater60PctRange[1]));
             $( "#dmaBelowPovertyPctSlider").slider("values", dmaBelowPovertyPctRange);
             $( "#dmaBelowPovertyPctNum").text(pctFormat(dmaBelowPovertyPctRange[0])+ " - " + pctFormat(dmaBelowPovertyPctRange[1]));


             sliderChangeDMA();
             sliderStopDMA();
             dmaMap.setView([39.5, -98.5], 4);
        }

        //  d3.selectAll('.lcircle').remove();
        // d3.selectAll(".pulse_circle").remove();
        // d3.select("#contents").html("");
        // d3.select("#recordSection").style("display","none");
        // d3.select("#txtSelection").text("0 stations selected out of " + data.size()); 
        // lmap.setView([39.5, -98.5], 3);
}