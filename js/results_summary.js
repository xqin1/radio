var DisplayInput = {} || DisplayInput,
	DisplayOutput = {} || DisplayOutput;
	
DisplayInput = {
	init: function () {
		
		// bind data to tables
		$('#tbl-byBandInput').data("tableData", summaryData.input_summary.by_band);
		$('#tbl-byBidTypeInput').data("tableData", summaryData.input_summary.by_bid_type);
		$('#tbl-byClassificationInput').data("tableData", summaryData.input_summary.by_classification);
		$('#tbl-byDMARankInput').data("tableData", summaryData.input_summary.by_dma_rank);
		$('#tbl-byPopulationInput').data("tableData", summaryData.input_summary.by_population);
		$('#tbl-byBlockedChanInput').data("tableData", summaryData.input_summary.by_blocked_channel);		
		
		this.displayConfigInfo();
		this.buildTables();
		this.modifyTableRowLabels();
		
	}, // end init
	displayConfigInfo: function () {
		var tempArr = [];
		
		$.each(targetProfile, function (key, value) {
			tempArr.push(value);
		});
		
		$('.sect-configInfo').find('dd').each(function(index, element) {
			$(this).text(tempArr[index+2]);
		});
		
		$('.sect-configInfo').find('.panel').text(targetProfile.profile_desc);
		
		$('.hd-scenarioInfo').find('.profile-name').text(targetProfile.profile_name);
	},
	buildTables: function () {
		$('#inputSummary').find('.tbl-inputDefault').tablebargraph({	
			numberOfCols: 4,
			colsWithGraph: [2]
		});
		
		$('#tbl-byBidTypeInput').tablebargraph({				
			numberOfCols: 5,
			colsWithGraph: [2]
		});
	}, 
	modifyTableRowLabels: function () {
		var rowHd = [],
			rowLabel = '',
			indexCount = 0;
		
		// modify row headings supplied by data
		$('#tbl-byBandInput').find('tbody').find('th').each(function(index, element) {            
			rowLabel = $(this).text().split('_')[0];
			$(this).text(rowLabel);
        });
		
		// get row category headings from supplied data 
		$.each($('#tbl-byBidTypeInput').data("tableData"), function (key, value) {
			rowHd.push(key);
		});

		// create row category headings and nested sub-headings
		$('#tbl-byBidTypeInput').find('tbody').find('th').each(function(index, element) {            			
			rowLabel = $(this).text().split('_')[0];
			
			if (rowLabel == 'total') {
				if (indexCount > 0) {
					rowLabel =  rowHd[indexCount].split('_');
					$(this).html('<span>' + rowLabel[0] + '</span> ' + rowLabel[1]);
				} else {
					rowLabel = rowHd[indexCount]; 
					$(this).html(rowLabel.replace(/_/g,' '));	
				}
				
				indexCount++;
			} else {
				$(this).addClass('indent').text(rowLabel);	
			}
        });	
	}	
}

DisplayOutput = {
	init: function () {
		
		// bind data to tables
		$('#tbl-byBandOutput').data("tableData", summaryData.output_summary.by_band);
		$('#tbl-byBidTypeOutput').data("tableData", summaryData.output_summary.by_bid_type);
		$('#tbl-byClassificationOutput').data("tableData", summaryData.output_summary.by_classification);
		$('#tbl-byDMARankOutput').data("tableData", summaryData.output_summary.by_dma_rank);
		$('#tbl-byPopulationOutput').data("tableData", summaryData.output_summary.by_population);
		$('#tbl-byBlockedChanOutput').data("tableData", summaryData.output_summary.by_blocked_channel);		
		
		this.highLevelInfoOuput();
		this.buildTables();
		this.modifyTableRowLabels();
		
	}, // end init
	highLevelInfoOuput: function () {
		var tempArr = [];
		
		$.each(summaryData.high_level_outputSummary, function (key, value) {
			tempArr.push(value);
		});
		
		$('.dl-outSummary').find('dd').each(function(index, element) {
			$(this).text(tempArr[index]);
		});
		
		$('.dl-outputTotals').find('dd').each(function(index, element) {
			var thisText = $(this).text(),
				textVal = '';
				
			textVal = (thisText == 0) ? 0 : formatMoney(thisText);
			$(this).text(textVal);
		});
	}, // end highLevelInfo
	buildTables: function () {
		$('#outputSummary').find('.tbl-outputDefault').tablebargraph({	
			numberOfCols: 8,
			colsWithGraph: [2, 5]
		});
	}, 
	modifyTableRowLabels: function () {
		var rowHd = [],
			rowLabel = '',
			indexCount = 0;
			
		// modify row headings supplied by data
		$('#tbl-byBandOutput').find('tbody').find('th').each(function(index, element) {            
			rowLabel = $(this).text().split('_')[0];
			$(this).text(rowLabel);
        });
		
		// get row category headings from supplied data 
		$.each($('#tbl-byBidTypeOutput').data("tableData"), function (key, value) {
			rowHd.push(key);
		});
		
		// create row category headings and nested sub-headings
		$('#tbl-byBidTypeOutput').find('tbody').find('th').each(function(index, element) {            			
			rowLabel = $(this).text().split('_')[0];
			
			if (rowLabel == 'total') {
				if (indexCount > 0) {
					rowLabel =  rowHd[indexCount].split('_');
					$(this).html('<span>' + rowLabel[0] + '</span> ' + rowLabel[1]);
				} else {
					rowLabel = rowHd[indexCount]; 
					$(this).html(rowLabel.replace(/_/g,' '));	
				}
				
				indexCount++;
			} else {
				$(this).addClass('indent').text(rowLabel);	
			}
        });	
	}	
}