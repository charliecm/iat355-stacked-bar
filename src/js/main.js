/**
 * Main Interactions
 */

/* global d3 */

document.addEventListener('DOMContentLoaded', function() {

	// Data
	var data,
		dataURL = 'AutomobileSales.csv',
		activeDimension = '',
		dimensions = [
			{
				label: 'Cars',
				name: 'carSales',
				color: '#ccff00'
			},
			{
				label: 'Bikes',
				name: 'bikeSales',
				color: '#c00ff3'
			},
			{
				label: 'Trucks',
				name: 'truckSales',
				color: '#00cf33'
			},
		];

	// UI
	var canvas = document.getElementById('canvas'),
		svg = d3.select(canvas).append('svg');

	// https://github.com/jashkenas/underscore/blob/master/underscore.js#L880
	function debounce(func, wait, immediate) {
		var timeout, args, context, timestamp, result;
		var _now = Date.now || function() {
			return new Date().getTime();
		};
		var later = function() {
			var last = _now() - timestamp;
			if (last < wait && last >= 0) {
				timeout = setTimeout(later, wait - last);
			} else {
				timeout = null;
				if (!immediate) {
					result = func.apply(context, args);
					if (!timeout) context = args = null;
				}
			}
		};
		return function() {
			context = this;
			args = arguments;
			timestamp = _now();
			var callNow = immediate && !timeout;
			if (!timeout) timeout = setTimeout(later, wait);
			if (callNow) {
				result = func.apply(context, args);
				context = args = null;
			}
			return result;
		};
	}

	function setupLegends() {
		var eleList = document.getElementById('legends-list'),
			eleItem, eleColor, eleLabel;
		dimensions.forEach(function(dimension) {
			eleItem = document.createElement('li');
			eleItem.className = 'legends__item';
			eleItem.addEventListener('click', function() {
				activeDimension = dimension.name;
			});
			eleColor = document.createElement('span');
			eleColor.className = 'legends__color';
			eleColor.style.backgroundColor = dimension.color;
			eleLabel = document.createElement('span');
			eleLabel.className = 'legends__label';
			eleLabel.textContent = dimension.label;
			eleItem.appendChild(eleColor);
			eleItem.appendChild(eleLabel);
			eleList.appendChild(eleItem);
		});
	}

	// Setup diagram canvas
	function setupDiagram() {
		// gWrap = svg.append('g');
	}

	// Draws the diagram
	function redraw() {
		var width = 300; // canvas.clientWidth;
		// Resize
		svg.attrs({
			width: width,
			height: width
		});
	}

	// Fetches and parses the data
	function fetch() {
		d3.csv(dataURL)
			.row(function(d) {
				return {
					month: d['Month'],
					carSales: +d['Car Sales'],
					bikeSales: +d['Bike Sales'],
					truckSales: +d['Truck Sales']
				};
			})
			.get(function(d) {
				// Initialize diagram
				data = d;
				setupLegends();
				setupDiagram();
				redraw();
				window.addEventListener('resize', debounce(redraw, 500));
			});
	}

	// Get the ball rolling...
	fetch();

});
