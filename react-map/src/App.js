import React, {Component} from "react";
import './App.css';
import { Map, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon } from 'leaflet';

export default class App extends Component {
  constructor() {
    super();
    this.state = {
	  listening: false,
	  markers: [],
	  source: new EventSource("http://localhost:4002/" + 'events')
    };
  }
	
  componentDidMount(){
	  const {markers, source} = this.state;
	  console.log(this.state.source);
	  source.onmessage =  event  => {
		var data = JSON.parse(event.data);
		if(!this.state.listening)
		{
		  data.shift();
		  console.log(data);
		  data.forEach(element => {
			  if( !isNaN(Number(element.latitude)) && !isNaN(Number(element.longitude))){
				markers.push(
					{
						position: [Number(element.latitude), Number(element.longitude)],
						name: element.name,
						docks: element.docks,
						docks_available: element.docks_available,
						percentage: element.percentage,
						full_code: element.full_code
					});
			  }

		  });
		  this.setState({listening: true, markers:markers, source: source});
		}
		else{
			let markers=  this.state.markers;
			console.log(data.name);
			if(data.code === "add")
			{
				markers.push({
					position: [Number(data.latitude), Number(data.longitude)],
					name: data.name,
					docks: data.docks,
					docks_available: data.docks_available,
					percentage: data.percentage,
					full_code: data.full_code
				});
			}
			if(data.code === "remove")
			{
				markers = markers.filter(marker => marker.stationId != data.stationId)
			}
			if(data.code === "update")
			{
				markers = markers.map(marker => {
					if(marker.stationId == data.stationId)
					{
						marker = {
							position: [Number(data.latitude), Number(data.longitude)],
							name: data.name,
							docks: data.docks,
							docks_available: data.docks_available,
							percentage: data.percentage,
							full_code: data.full_code
						}
					}
					return marker;
				})
			}
			this.setState({markers:markers});
		}
	  };
  }
  
  render() {
    return (
	<div className="App">
      <header className="App-header" height="100%" width="100%">
		<div>
		  <Map 
			center={[41.888243, -87.63639]}
			zoom={13} 
			width="100%"
			height="100%"
			>
			<TileLayer
			  attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
			  url='http://{s}.tile.osm.org/{z}/{x}/{y}.png'
			  width="100%"
			  height="100%"
			/>
			{this.state.markers.map((marker, idx) => 
			  <Marker key={`${idx}`} position={marker.position}
			  			icon = {new Icon({
							iconUrl: require('./icons/map-pin'+marker.full_code+'.png'),
							iconSize: [30, 30]
						})}
						onMouseOver={(e) => {
						  e.target.openPopup();
						}}
						onMouseOut={(e) => {
						  e.target.closePopup();
						}}>
				<Popup key={`popup-${idx}`} position={marker.position} >
					{marker.name}
					<br/>
					Docks available: {marker.docks_available}
					<br/>
					Docks: {marker.docks}
					<br/>
					Percentage full: {100 - marker.percentage} %
					</Popup>
			  </ Marker>
			)}	
		  </Map>
		</div>
	  </header>
    </div>
    );
  }
}
