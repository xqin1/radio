var pctFormat = d3.format(".0%");
var spectrumObj={};
var  dmaToolTip = CustomTooltip("dma_tooltip", 250);
var dmaTableRowSelected=false;

function sliderChangeDMA(){
	setDMATableTitle();
	drawDMAMap();
  updateSpectrumOnDMAMap();
}


function sliderStopDMA(){
	 var filteredDMAs = dmaFilter.dma_pop.top(Infinity)
	 				.sort(function(a,b){return a.dma_name - b.dma_name});
	drawDMATable(filteredDMAs);
}

function setDMATableTitle(){
	var numDMA = dmaFilter.dma_pop.top(Infinity).length;
	var pop = d3.sum(dmaFilter.dma_pop.top(Infinity), function(d){return d.dma_pop});
	var numStation = d3.sum(dmaFilter.station_number.top(Infinity), function(d){return d.number_of_stations});	
	$("#numDMAs").html("Number of DMAs: "  + numDMA + "&nbsp;|&nbsp;Population: " + popFormat(pop)+ "&nbsp;|&nbsp;Number of Stations: " + numStation);
}

function drawDMATable(d){
  d3.select("#dmaContents").html("");
  var content = "", ids=[];
  content += "<table id='tbl-recordDetailsDMA' class='table table-cellBorder table-hover table-striped tablesorter'><thead><tr><th><div class='sort-wrapper'>DMA Name&nbsp;<span class='sort'></span></div></th><th><div class='sort-wrapper'>Population &nbsp;<span class='sort'></span></div></th><th><div class='sort-wrapper'>No.Stations &nbsp;<span class='sort'></span></div></th><th class='text-center'><div class='sort-wrapper'>% Hispanic &nbsp;<span class='sort'></span></div></th><th><div class='sort-wrapper'>% HS Grad &nbsp;<span class='sort'></span></div></th><th><div class='sort-wrapper'>% Age 60&nbsp;<span class='sort'></span></div></th><th class='text-right' style='padding-right: 20px;'><div class='sort-wrapper'>% Below Poverty &nbsp;<span class='sort'></span></div></tr></thead>";

    content += "<tbody>";
    for (var i = 0, length = d.length; i<length; i++) {
    //console.log(d[i].fips + " " + getStateName(d[i].fips).abbrName)
              content += "<tr data-dma_id='" + d[i]["dma_id"] + "'><td>" + d[i]["dma_name"] + "</td>";
              content += "<td class='text-right'>" + commaNumFormat(d[i]["dma_pop"]) + "</td>";
              content += "<td>" + d[i]["number_of_stations"] + "</td>";
              content += "<td class='text-center'>" + pctFormat(d[i]["percent_hispanic"]) + "</td>";
              content += "<td class='text-center'>" + pctFormat(d[i]["percent_pop_hsgrad"]) +  "</td>";
              content += "<td class='text-center'>" + pctFormat(d[i]["percent_age_greater60"]) +  "</td>";
              content += "<td class='text-center'>" + pctFormat(d[i]["percent_income_below_povertyline"]) +  "</td></tr>";

        } 
    content +="</tbody></table>";

    $("#dmaContents").html(content);
    initTblSortDMA();

     d3.selectAll("#tbl-recordDetailsDMA tbody tr")
          .on("click", function(){
            dmaTableRowSelected = false;
              if (d3.select(this).classed('tablerowselected')){
                dmaTableRowSelected = true;
              }
              d3.selectAll("#tbl-recordDetailsDMA tbody tr").classed('tablerowselected',false);
              zoomToDMA(d3.select(this));
            })
}

function zoomToDMA(selectedRow){
  var dma_id = +selectedRow.attr("data-dma_id");

  if (dmaTableRowSelected){
    dmaMap.setView([39.5, -98.5], 4);
  }
  else{
      selectedRow.classed('tablerowselected', true);     
  }
   var dmaFeature = dmaJson.features.filter(function(d){return d.properties.ID==dma_id});
      var dmaJsonObj = {type:"FeatureCollection",features:dmaFeature};
      var dmaBound = L.geoJson(dmaJsonObj).getBounds();
      dmaMap.fitBounds(dmaBound)
  //console.log(dma_id);
}


function initTblSortDMA() {
  if ($('#tbl-recordDetailsDMA') && $('#tbl-recordDetailsDMA tbody tr').length > 1) {
    $('#tbl-recordDetailsDMA').dataTable({
      "aoColumns": [{ "sWidth": "155px" }, {"sType": "formatted-num", "sWidth": "85px" }, { "sWidth": "80px" }, {"sType":"percent","sWidth": "100px" }, { "sType": "percent", "sWidth": "175px" }, { "sType": "percent" }, { "sType": "percent" }],
      "aaSorting": [
        [1, "desc"]
      ],
	  "asStripeClasses":[],	  
      "bDestroy": true,
      "bFilter": false,
      "bInfo": false,
      "bPaginate": false,
      "bLengthChange": false,
    "bScrollCollapse": true,
	"bSortClasses": false,
    "sScrollY": 400/*,
    "sScrollX": "100%",
      "sScrollXInner": "110%"*/
    });
  }
}

function resetDMAFilter(){
	dmaFilter.dma_pop.filterAll();
	dmaFilter.station_number.filterAll(); 
	dmaFilter.percent_hispanic.filterAll(); 
    dmaFilter.percent_age_greater60.filterAll(); 
      dmaFilter.percent_pop_hsgrad.filterAll(); 
        dmaFilter.percent_income_below_povertyline.filterAll(); 
}

function resetDMAMap(){
    var bottomLeft = projectStation(bounds[0]),
        topRight = projectStation(bounds[1]);

    svgDMAMap .attr("width", topRight[0] - bottomLeft[0])
        .attr("height", bottomLeft[1] - topRight[1])
        .style("margin-left", bottomLeft[0] + "px")
        .style("margin-top", topRight[1] + "px");

    dmaOverlayMap.attr("transform", "translate(" + -bottomLeft[0] + "," + -topRight[1] + ")");
    if (dmaBoundaryOnDMAMap != null){
          dmaBoundaryOnDMAMap.attr("d", dmaPathOnDMAMap);
        }
     dmaFeatureOnDMAMap.attr("d", dmaPathOnDMAMap);

    // if(stationCircleOnStationMap != null){
    //     d3.transition(stationCircleOnStationMap)
    //  //                      .attr("class", "stationCircleOnStationMap")
  		// 	// .style("fill",function(d){return d.action == "OFF_AIR" ? "#d6616b" : "yellow"})
    //                     .attr("transform", function(d) {
    //                           var c = projectStation([d.longitude,d.latitude])
    //                           x = c[0];
    //                           y = c[1];
    //                           return "translate(" + x + "," + y + ")";
    //                     })
    // }

    // stationOverlayMap.selectAll(".pulse_circle")
    //                 .attr("class", "pulse_circle")
    //                 .attr("transform", function(d) {
    //                       var centroid = projectStation(d)
    //                       x = centroid[0];
    //                       y = centroid[1];
    //                       return "translate(" + x + "," + y + ")";
    //                 })
   
}
// Use Leaflet to implement a D3 geographic projection.
function projectDMA(x) {
    var point = dmaMap.latLngToLayerPoint(new L.LatLng(x[1], x[0]));
    return [point.x, point.y];
  }


function drawDMAMap(){
       dmaFeatureOnDMAMap = dmaOverlayMap.selectAll(".dmaPathOnDMA")
                .data(dmaFilter.dma_pop.top(Infinity), function(d){return d.dma_id});
        //enter
        dmaFeatureOnDMAMap.enter().append("path")
              .attr("class","dmaPathOnDMA")
            .on("mouseover", function(d){showDMADetail(d)})
            .on("mouseout", function(d){hideDMADetail()});;
        //update
        dmaFeatureOnDMAMap
            .on("mouseover", function(d){showDMADetail(d)})
            .on("mouseout", function(d){hideDMADetail()})
        .transition()
          .attr("class","dmaPathOnDMA")


        dmaFeatureOnDMAMap.exit().remove();

        resetDMAMap();

	// dmaFeatureOnDMAMap.transition()
	// 	.style("fill-opacity", function(d){
	// 	    //return typeof dmaDataByID[d.id] == "undefined" ? 0:dmaTrans(dmaDataByID[d.id][0]["SPECTRUM_UTILIZATION_PCT"])
	// 	         return typeof dmaDataByID[d.DMA_ID] == "undefined" ? 0:0.7;
	// 	       })
	// 	.style("fill", function(d){
	// 	    return typeof dmaDataByID[d.DMA_ID] == "undefined" ? "white":dmaFillColor(dmaDataByID[d.DMA_ID][0]["SPECTRUM_UTILIZATION_PCT"]);
	// 	});
}

function updateSpectrumOnDMAMap(){
    dmaFeatureOnDMAMap.transition()
    // .style("fill-opacity", function(d){
    //    //return typeof dmaDataByID[d.id] == "undefined" ? 0:dmaTrans(dmaDataByID[d.id][0]["SPECTRUM_UTILIZATION_PCT"])
    //         return typeof dmaDataByID[d.DMA_ID] == "undefined" ? 0:0.7;
    //       })
   .style("fill", function(d){
       //return typeof dmaDataByID[d.DMA_ID] == "undefined" ? "white":dmaFillColor(dmaDataByID[d.DMA_ID][0]["SPECTRUM_UTILIZATION_PCT"]);
            return dmaFillColor(d.percent_hispanic);

   });
}

function drawDMALegend(){
	var svg = d3.select("#dmaLegend").append("svg:svg")
    .attr("width", 300)
    .attr("height", 40);

	var gradient = svg.append("svg:defs")
	  .append("svg:linearGradient")
	    .attr("id", "gradient")
	    .attr("x1", "0%")
	    .attr("y1", "0%")
	    .attr("x2", "100%")
	    .attr("y2", "100%")
	    .attr("gradientUnits", "userSpaceOnUse")
	   // .attr("spreadMethod", "pad");

	gradient.append("svg:stop")
	    .attr("offset", "0%")
	    .attr("stop-color", "white")
	    .attr("stop-opacity", 1);

	gradient.append("svg:stop")
	    .attr("offset", "80%")
	    .attr("stop-color", "red")
	    .attr("stop-opacity", 1);

	svg.append("svg:rect")
	    .attr("width", 240)
	    .attr("height", 10)
	    .style("fill", "url(#gradient)");
	svg.append("text")
		.text("Hispanic/Latino Population")
		.attr("x", 60)
		.attr("y",25);
	svg.append("text")
		.text(pctFormat(0))
		.attr("x", 0)
		.attr("y",25);
	svg.append("text")
		.text(pctFormat(0.5))
		.attr("x", 230)
		.attr("y",25);
}


function showDMADetail(d){
  var content = "";
  content += "<span class='name'>Name: </span><span class='value'>" + d.dma_name + "</span><br/>";
  content += "<span class='name'>Stations: </span><span class='value'>" + d.number_of_stations + "</span>";
    content += "<span class='separator'>&nbsp;|&nbsp;</span>";
  content += "<span class='name'>DMA Pop: </span><span class='value'>" + popFormat(d.dma_pop) + "</span><br/>";
  content += "<span class='name'>% Hispance/Latino: </span><span class='value'>" + pctFormat(d.percent_hispanic) + "</span>";
  content += "<span class='separator'>&nbsp;|&nbsp;</span>";
  content += "<span class='name'>% HS Grad: </span><span class='value'>" + pctFormat(d.percent_pop_hsgrad) + "</span></br>";
  content += "<span class='name'>% Age 60: </span><span class='value'>" + pctFormat(d.percent_age_greater60) + "</span>";
  content += "<span class='separator'>&nbsp;|&nbsp;</span>";
  content += "<span class='name'>% Below Poverty: </span><span class='value'>" + pctFormat(d.percent_income_below_povertyline) + "</span>";
  dmaToolTip.showTooltip(content,d3.event);
}

function hideDMADetail(){
  dmaToolTip.hideTooltip();
}