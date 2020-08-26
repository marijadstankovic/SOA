import React, {Component} from "react";
import './App.css';
import { Map, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon } from 'leaflet';

const iconPerson = new Icon({
    iconUrl: require('./icons/man-user.svg'),
    iconSize: [15, 24]
});

export default class App extends Component {
  constructor() {
    super();
    this.state = {
	  listening: false,
	  markers: [],
	  source: new EventSource('http://localhost:4002/events')
    };
  }
	
  componentDidMount(){
	  const {markers, source} = this.state;
	  
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
						docker: element.docks,
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
			if(data.code === "add")
			{

			}
			if(data.code === "remove")
			{

			}
			if(data.code === "update")
			{
				
			}
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
							iconUrl: require('./icons/man-user.svg'),
							iconSize: [marker.full_code*10, marker.full_code*10]
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
					{marker.percentage}
					<br/>
					{marker.full_code}
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

/**
{this.state.markers.map((marker, idx) => 
			  <Marker key={`${idx}`} position={marker} icon = {iconPerson}
						onMouseOver={(e) => {
						  e.target.openPopup();
						}}
						onMouseOut={(e) => {
						  e.target.closePopup();
						}}>
				<Popup key={`popup-${idx}`} position={marker} >Sydney</Popup>
			  </ Marker>
			)}	
 */