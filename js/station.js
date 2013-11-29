var summaryTable;
var stationTableRowSelected=false;
var moneyFormat = d3.format(",.2s");
var popFormat = d3.format(",.1s");
var commaNumFormat = d3.format(",");
var  stationToolTip = CustomTooltip("station_tooltip", 250);


function sliderChangeStations(){
	 setStationTableTitle();
}

function setStationTableTitle(){

	var numStation = stationFilter.avg_aqh.top(Infinity).length;
	var avg_aqh_num = parseInt(d3.mean(stationFilter.avg_aqh.top(Infinity),function(d){return d.avg_aqh}));
	$("#numStations").html("Number of Stations: "  + numStation + "&nbsp;|&nbsp;Average AQH: " + avg_aqh_num);
}

function sliderStopStations(){
	 var stations = stationFilter.avg_aqh.top(Infinity)
	 	.sort(function(a,b){return a.callsing-b.callsign});
	drawStationTable(stations);
	d3.selectAll(".pulse_circle").remove();
	stationMap.setView([39.5, -98.5], 4);
    drawStationMap(stations);
}


function drawStationTable(d){
  d3.select("#stationContents").html("");
  var content = "", ids=[];
  if (d.length>0){
  	$("#stationDetailSection").show();
	  content += "<table id='tbl-recordDetails' class='table table-cellBorder table-hover table-striped tablesorter'><thead><tr><th><div class='sort-wrapper'>Callsign&nbsp;<span class='sort'></span></div></th><th><div class='sort-wrapper'>Channel &nbsp;<span class='sort'></span></div></th><th><div class='sort-wrapper'>City &nbsp;<span class='sort'></span></div></th><th><div class='sort-wrapper'>State &nbsp;<span class='sort'></span></div></th><th><div class='sort-wrapper'>DMA &nbsp;<span class='sort'></span></div></th><th><div class='sort-wrapper'>classification &nbsp;<span class='sort'></span></div></th><th class='text-right' style='padding-right: 20px'><div class='sort-wrapper'>Average AQH &nbsp;<span class='sort'></span></div></tr></thead>";

	    content += "<tbody>";
	    for (var i = 0, length = d.length; i<length; i++) {
	    //console.log(d[i].fips + " " + getStateName(d[i].fips).abbrName)
	              content += "<tr data-lat=" + d[i].latitude + " data-lon=" + d[i].longitude + " data-callsign='" + d[i]["callsign"] + "'><td>" + d[i]["callsign"] + "</td>";
	              content += "<td>" + d[i]["channel"] + "</td>";
	              content += "<td>" + d[i]["city"] + "</td>";
	              content += "<td>" + d[i]["stateabbr"] + "</td>";
	              content += "<td>" + d[i]["dma_name"] + "</td>";
	              content += "<td>" + d[i]["classification"] +  "</td>";
	              content += "<td class='text-right'>" + commaNumFormat(d[i]["avg_aqh"]) + "</td></tr>";
	              // content += "<td>" + d[i].affiliation + "</td>";
	              // content += "<td>" + d[i].availableChannels + "</td></tr>";
	        } 
	    content +="</tbody></table>";

	    $("#stationContents").html(content);
	    initTblSort();

	    d3.selectAll("#tbl-recordDetails tbody tr")
        	.on("click", function(){
        		stationTableRowSelected = false;
            	if (d3.select(this).classed('tablerowselected')){
             		stationTableRowSelected = true;
            	}
             	d3.selectAll("#tbl-recordDetails tbody tr").classed('tablerowselected',false);
            	highlight(d3.select(this));
          	})
     //drawLMap(d);
	}
	else{
		$("#stationDetailSection").hide();
	}
}

function initTblSort() {
  if ($('#tbl-recordDetails') && $('#tbl-recordDetails tbody tr').length > 1) {
    $('#tbl-recordDetails').dataTable({
      "aoColumns": [null, null, null, null, {"sWidth": "185px"}, null, {"sType": "formatted-num"}],
    // "aoColumnDefs": [
    //         { 'bSortable': false, 'aTargets': [ 6 ] }
    //      ],
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
	
    "sScrollY": 400/*,
    "sScrollX": "100%",
      "sScrollXInner": "110%"*/
    });
  }
}

function drawStationMap(d){

  stationCircleOnStationMap = stationOverlayMap.selectAll(".stationCircleOnStationMap")
                      .data(d, function(d){return d.callsign});

  //enter
  stationCircleOnStationMap.enter().append("circle")
  			.attr("class", "stationCircleOnStationMap")
  			.style("fill","#d6616b")
           .attr("transform", function(d){
                            var c = projectStation([d.longitude,d.latitude]);
                            var x = c[0], y = c[1];
                            return "translate(" + x + "," + y + ")";
                          })
            //.attr("r", function(d){return populationScale(d.population)})
            .attr("r",1e-6)
            .on("mouseover", function(d){showStationDetail(d)})
            .on("mouseout", function(d){hideStationDetail()});

//update
  stationCircleOnStationMap
  	  		.attr("class", "stationCircleOnStationMap")
  			.style("fill","#d6616b")
  			.on("mouseover", function(d){showStationDetail(d)})
  			.on("mouseout", function(d){hideStationDetail(d)})
        .transition()
          .duration(750)
          .attr("transform", function(d){
                var c = projectStation([d.longitude,d.latitude]);
                var x = c[0], y = c[1];
                return "translate(" + x + "," + y + ")";
              })
          .attr("r", function(d){return avgAQHScale(d.avg_aqh)})
         // .on("mouseover", function(d){showStationDetail(d,this)});

  //exit
  stationCircleOnStationMap.exit()
  		  	.attr("class", "stationCircleOnStationMap")
  			.style("fill","#d6616b")
          .transition()
          .duration(750)
          .style("fill-opacity",1e-6)
          .remove();

  resetStationMap();
}

function showStationDetail(d){
	var content = "";
	content += "<span class='name'>Callsign: </span><span class='value'>" + d.callsign + "</span>";
	content += "<span class='separator'>&nbsp;|&nbsp;</span>";
  content += "<span class='name'>Channel: </span><span class='value'>" + d.channel + "</span></br>";
	content += "<span class='name'>City: </span><span class='value'>" + d.city + "</span>";
  content += "<span class='separator'>&nbsp;|&nbsp;</span>";
	content += "<span class='name'>State: </span><span class='value'>" + d.stateabbr + "</span></br>";

  content += "<span class='name'>Average AQH: </span><span class='value'>" +commaNumFormat(d.avg_aqh) + "</span>";
	content += "<span class='separator'>&nbsp;|&nbsp;</span>";
  content += "<span class='name'>Male AQH: </span><span class='value'>" + commaNumFormat(d.male_aqh) + "</span></br>";

    content += "<span class='name'>Female AQH: </span><span class='value'>" +commaNumFormat(d.female_aqh) + "</span>";
  content += "<span class='separator'>&nbsp;|&nbsp;</span>";
  content += "<span class='name'>Age 18-34 AQH: </span><span class='value'>" + commaNumFormat(d["18to34_aqh"]) + "</span></br>";

      content += "<span class='name'>Age 35-49 AQH: </span><span class='value'>" +commaNumFormat(d["35to49_aqh"]) + "</span>";
  content += "<span class='separator'>&nbsp;|&nbsp;</span>";
  content += "<span class='name'>Age gr50 AQH: </span><span class='value'>" + commaNumFormat(d["50plus_aqh"]) + "</span></br>";

      content += "<span class='name'>Weekday AQH: </span><span class='value'>" +commaNumFormat(d.mon_fri_aqh) + "</span>";
  content += "<span class='separator'>&nbsp;|&nbsp;</span>";
  content += "<span class='name'>Weekend AQH: </span><span class='value'>" + commaNumFormat(d.weekend_aqh) + "</span>";
	
	stationToolTip.showTooltip(content,d3.event);
}

function hideStationDetail(){
	stationToolTip.hideTooltip();
}

function resetStationMap(){
    var bottomLeft = projectStation(bounds[0]),
        topRight = projectStation(bounds[1]);

    svgStationMap .attr("width", topRight[0] - bottomLeft[0])
        .attr("height", bottomLeft[1] - topRight[1])
        .style("margin-left", bottomLeft[0] + "px")
        .style("margin-top", topRight[1] + "px");

    stationOverlayMap.attr("transform", "translate(" + -bottomLeft[0] + "," + -topRight[1] + ")");

    dmaBoundaryOnStationMap.attr("d", dmaPathOnStationMap);

    if(stationCircleOnStationMap != null){
        d3.transition(stationCircleOnStationMap)
     //                      .attr("class", "stationCircleOnStationMap")
  			// .style("fill",function(d){return d.action == "OFF_AIR" ? "#d6616b" : "yellow"})
                        .attr("transform", function(d) {
                              var c = projectStation([d.longitude,d.latitude])
                              x = c[0];
                              y = c[1];
                              return "translate(" + x + "," + y + ")";
                        })
    }

    stationOverlayMap.selectAll(".pulse_circle")
                    .attr("class", "pulse_circle")
                    .attr("transform", function(d) {
                          var centroid = projectStation(d)
                          x = centroid[0];
                          y = centroid[1];
                          return "translate(" + x + "," + y + ")";
                    })
   
}
// Use Leaflet to implement a D3 geographic projection.
function projectStation(x) {
    var point = stationMap.latLngToLayerPoint(new L.LatLng(x[1], x[0]));
    return [point.x, point.y];
  }

//highligh selected station
function highlight(selectedRow){
  var lat = +selectedRow.attr("data-lat"), lon = +selectedRow.attr("data-lon");
  var coord=[lon,lat];

  d3.selectAll(".pulse_circle").remove();
  if (stationTableRowSelected){
    stationMap.setView([39.5, -98.5], 4);
  }
  else{
      selectedRow.classed('tablerowselected', true);
      stationOverlayMap.selectAll(".pulse_circle").data([coord])
                .enter().append("circle")
                    .attr("class", "pulse_circle")
                    .attr("transform", function(d) {
                          var centroid = projectStation(d)
                          x = centroid[0];
                          y = centroid[1];
                          return "translate(" + x + "," + y + ")";
                    })
                    .each(pulse()); 
		stationMap.setView([lat, lon], 10);
  }

}

function unhighlight(){
	d3.selectAll(".pulse_circle").remove();
}

function pulse() {
  return function(d, i, j) {
      //the stuff before transition() resets the
      //attributes of the pulser when this function is
      //called again
      d3.select(this).attr("r", 15).style("stroke-opacity", 1.0)
      .transition()
      .ease("linear") //appears a lot more smoother
      .duration(1000)
      .attr("r",25)
      .style("stroke-opacity", 0.0)
      .each("end", pulse()); //lather rinse repeat
  };
}

function resetStationFilter(){
  stationFilter.avg_aqh.filterAll();
   stationFilter.male_aqh.filterAll(); 
   stationFilter.female_aqh.filterAll(); 
   stationFilter["18to34_aqh"].filterAll();
   stationFilter["35to49_aqh"].filterAll();
  stationFilter["50plus_aqh"].filterAll();
  stationFilter.weekday_aqh.filterAll();
  stationFilter.weekend_aqh.filterAll();
}



