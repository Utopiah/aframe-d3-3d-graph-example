const _ = require('lodash')
const d3 = require('d3')
window.d3 = d3
require('./d3.layout.force3D.js')(d3)
require('aframe')
require('aframe-meshline-component')

window.onload = () => {

	//var graph = buildGraph(20, 40, 1, 5)
	//graphDraw(graph);

	loadRemoteGraph(
			"http://vatelier.net/MyDemo/newtooling/wiki_graph.json",
			100,
			graphDraw); // callsback
}

function graphDraw(graph){
	var color = d3.scale.category20()

	var scene = d3.select('a-scene')

	var width = scene.attr('width')
	var height = scene.attr('height')

	var force = d3.layout.force3D()
		.charge(-5)
		.linkDistance(1)
	    .size([width, height, height])

	force
	    .nodes(graph.nodes)
	    .links(graph.links)
	    .start()

	var link = scene
	    .selectAll('a-entity')
	    .filter('.link')
	    .data(graph.links)
	    .enter().append('a-entity')
	    .attr('class', 'link')

	var node = scene
	    .selectAll('a-sphere')
		.data(graph.nodes)
		.enter().append('a-sphere')
		.attr('class', 'node')
		.attr('radius', 1)
		.attr('color', d => color(d.group))

	force.on('tick', function() {
		node.attr('position', d => `${d.x} ${d.y} ${d.z}`)
	    link.attr('meshline', d => {
	        let sourcePoint = point(d.source)
	        let targetPoint = point(d.target)
	        return `lineWidth: 1; path: ${sourcePoint.join(' ')}, ${targetPoint.join(' ')}}; color: #ccc`
	    })
	})
}

function point(p) {
    return [p.x, p.y, p.z]
}

function buildGraph(nodes, links, groups, maxWeight) {

    let data = {
	nodes: [],
	links: []
    }

    for (let n = 0; n < nodes; n++) {
	data.nodes.push({
	    id: n,
	    group: _.random(1, groups)
	})
    }

    for (let l = 0; l < links; l++) {
	data.links.push({
	    source: _.random(0, nodes - 1),
	    target: _.random(0, nodes - 1),
	    value: _.random(1, maxWeight)
	})
    }

    console.log(data)
    return data

}

function loadRemoteGraph(myDataURL, MaxPages, draw){

	let data = {
		nodes: [],
		links: []
	}

	var myRequest = new XMLHttpRequest();
	myRequest.open('GET', myDataURL);
	myRequest.onreadystatechange = function () {
		if (myRequest.readyState === 4) {
			var result = parseRemoteJSON(myRequest.responseText);
			graphDraw(result);
		}
	};
	myRequest.send();

	function parseRemoteJSON(myJSON){
		function matchId(element){
			return element.title == this.toString()
		}

		var dictionary = JSON.parse(myJSON).Nodes;
		var keys = [];
		keys = Object.keys(dictionary);
		for (var i=0; i<MaxPages; i++){
			var page = dictionary[keys[i+1]];
			data.nodes.push({id: i, title: page.Id, group: page.Group});
		}
		for (var i=0; i<MaxPages; i++){
			var page = dictionary[keys[i+1]];
			if (page.Targets){
				for (var j=0; j<page.Targets.length; j++){
					var target = data.nodes.findIndex(matchId, page.Targets[j])
					if (target >= 0) // should parse once but... you know...
					data.links.push({source: i,
							target: target,
							weight: 1});
				}
			}
		} 
		draw(data)
	}
}
