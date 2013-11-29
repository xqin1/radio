/*
 *  Project: jquery.tablebargraph.js
 *  Description: Create a simple table with horizontal bar graphs within the table columns
 */

;(function ( $, window, document, undefined ) {

    var pluginName = "tablebargraph",
        defaults = {
            numberOfCols: 4,
			colsWithGraph: [2]
        };

    // Plugin constructor
    function Plugin( element, options ) {
        this.element = element;

        this.options = $.extend( {}, defaults, options );

        this._defaults = defaults;
        this._name = pluginName;

        this.init();
    }

    Plugin.prototype = {

        init: function() { 
			this.buildTable(this, this.options);
			this.drawBarGraph(this, this.options);
			this.formatData(this, this.options);
        },

        buildTable: function(el, options) { 
            var tblID = $(el.element),
				data = $(el.element).data("tableData"),
				tableRows = '',
				tableCells = '',
				countCols = 0,
				tblNumCols = options.numberOfCols - options.colsWithGraph.length - 1;
				tableCellGraph1 = '<td><div class="bar-container1"><div class="bar-inner"></div></div></td>',
				tableCellGraph2 = '<td><div class="bar-container2"><div class="bar-inner"></div></div></td>';
		
			function createTblRow(rowLabel) {			
				tableRows += '<tr><th>' + rowLabel + '</th>' + tableCells + '</tr>';
				tableCells = '';
				countCols = 0;			
			}
			
			$.each(data, function (key, value) {
				var bidType = key;
				
				if (typeof data[bidType] == 'object') {
					$.each(data[bidType], function (key, value) { 
					
	    				tableCells += '<td>' + data[bidType][key] + '</td>';
	    				
	    				countCols++;
	    
	    				if (countCols == tblNumCols) { 
							if (tblID.is('#tbl-byBidTypeInput') || tblID.is('#tbl-byBidTypeOutput')) {
								createTblRow(key);								
							} else {
								createTblRow(bidType);
							}						
	    				}
	    		
	    			});	
				} else {
					tableCells += '<td>' + data[bidType] + '</td>';	
					countCols++;
	
					if (countCols == tblNumCols) { 
						createTblRow(key);						
					}				
				}
			});
	
			if (options.colsWithGraph.length == 1) { 
				tblID.find('tbody').empty()
					.append(tableRows).end()
					.find('td:nth-child(' + options.colsWithGraph[0] + ')').after(tableCellGraph1);
			} else {
				tblID.find('tbody').empty()
					.append(tableRows).end()					
					.find('td:nth-child(' + options.colsWithGraph[0] + ')').after(tableCellGraph1).end()
					.find('td:nth-child(' + options.colsWithGraph[1] + ')').after(tableCellGraph2);
			}
        }, // end buildTable
		drawBarGraph: function (el, options) {
			var barContainerLen = 0;
			
			// Get the max value in an array
		    Array.max = function( array ){
		        return Math.max.apply(Math, array);
		    };
		
		    // Get the min value in an array
		    Array.min = function( array ){
		       return Math.min.apply(Math, array);
		    };
			
		    $(el.element).each(function(){
				var thisTbl = $(this);
				
				$(this).find('.bar-container1, .bar-container2').css('width', function(index, value) {
					var barContainer = $(this),
						innerBar = $(this).find('.bar-inner'),
						x = 0,
						y = barContainer.closest('td').next('td').text().replace(/,/g,''),
						tempArr = [],
						maxNum = 0,
						value = 0;						
					
					if (barContainer.is('.bar-container1')) {										
						thisTbl.find('td:nth-child(4)').each(function(){
							tempArr.push($(this).text().replace(/,/g,'')); 			
						});						
					} else { 					
						thisTbl.find('td:nth-child(7)').each(function(){
							tempArr.push($(this).text().replace(/,/g,'')); 			
						});					
					}
					
					maxNum = Array.max(tempArr);
					barContainerLen = (y/maxNum) * 100; 
					
					innerBar.css('width', function(index, value) {
						var bc = 0;
						
						x = $(this).closest('td').prev('td').text().replace(/,/g,'');
						bc = (x/y);
	
						value = (barContainerLen*bc);
						return value + 'px';			
					});

					if (x == 0 || y == 0) { 			
						barContainer.remove();
						innerBar.remove();	
					} else {
						return barContainerLen + 'px';	
					}
				});
			});	
		}, // end drawBarGraph
		formatData: function (el, options) {
			var currencyFormat = d3.format(","),
				textVal = '';
			
			function textToCurrency (cellText) {
				textVal = (cellText == 0) ? 0 : formatMoney(cellText);
				
				return textVal;
			}
			
			$(el.element).find('td:nth-child(2)').addClass('text-right');	
			
			if (options.numberOfCols > 4) {
				$(el.element).find('td:nth-child(5)').each(function () {
					textVal = $(this).text();
					
					if (options.colsWithGraph.length > 1) {
						$(this).addClass('text-right').text(textToCurrency(textVal));	
					} else {
						$(this).text(textToCurrency(textVal));
					}
					
				});
				
				$(el.element).find('td:nth-child(7)').each(function () {
					textVal = $(this).text();
					$(this).removeClass('text-right').text(textToCurrency(textVal));	
				});
				
				$(el.element).find('td:nth-child(8)').each(function () {
					textVal = $(this).text();
					$(this).removeClass('text-right').text(textToCurrency(textVal));	
				});
			} 
		}
    };

    // Plugin wrapper around the constructorp prevents multiple instantiations
    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName, new Plugin( this, options ));
            }
        });
    };

})( jQuery, window, document );